import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const isWindows = process.platform === 'win32';
const forceKillTimeoutMs = 5000;

const services = [
  { name: 'vite', args: ['run', 'dev'] },
  { name: 'proxy', args: ['run', 'dev:proxy'] },
];

function pipeWithPrefix(stream, output, prefix) {
  if (!stream) {
    return;
  }
  let buffer = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      output.write(`${prefix}${line}\n`);
    }
  });
  stream.on('end', () => {
    if (buffer.length > 0) {
      output.write(`${prefix}${buffer}\n`);
      buffer = '';
    }
  });
}

function terminateChild(child, signal) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  try {
    if (!isWindows) {
      process.kill(-child.pid, signal);
    } else {
      child.kill(signal);
    }
  } catch {
    // すでに終了しているプロセスは無視する
  }
}

const children = new Map();
let shuttingDown = false;
let finalExitCode = 0;
let forceKillTimer = null;

function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  finalExitCode = exitCode;

  for (const child of children.values()) {
    terminateChild(child, 'SIGTERM');
  }

  forceKillTimer = setTimeout(() => {
    for (const child of children.values()) {
      terminateChild(child, 'SIGKILL');
    }
  }, forceKillTimeoutMs);
  forceKillTimer.unref();
}

function onChildFinished(name) {
  children.delete(name);
  if (children.size === 0) {
    if (forceKillTimer) {
      clearTimeout(forceKillTimer);
    }
    process.exit(finalExitCode);
  }
}

const childEnv = {
  ...process.env,
  ...(process.stdout.isTTY ? { FORCE_COLOR: '1' } : {}),
};

for (const service of services) {
  const command = isWindows ? (process.env.ComSpec ?? 'cmd.exe') : 'pnpm';
  const args = isWindows ? ['/d', '/s', '/c', 'pnpm', ...service.args] : service.args;
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: childEnv,
    detached: !isWindows,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  children.set(service.name, child);
  const prefix = `[${service.name}] `;
  pipeWithPrefix(child.stdout, process.stdout, prefix);
  pipeWithPrefix(child.stderr, process.stderr, prefix);

  child.on('error', (error) => {
    process.stderr.write(`[dev:all] ${service.name} の起動に失敗しました: ${error.message}\n`);
    shutdown(1);
    onChildFinished(service.name);
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      const reason = signal ? `signal ${signal}` : `code ${code ?? 1}`;
      process.stderr.write(`[dev:all] ${service.name} が終了しました (${reason})。他のプロセスを停止します。\n`);
      shutdown(code && code !== 0 ? code : 1);
    }
    onChildFinished(service.name);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('SIGHUP', () => shutdown(0));
process.on('exit', () => {
  for (const child of children.values()) {
    terminateChild(child, 'SIGTERM');
  }
});
