#!/bin/sh

set -eu

mode=${1:-all}

case "$mode" in
  all|checks|build)
    ;;
  *)
    echo "Usage: $0 [all|checks|build]" >&2
    exit 2
    ;;
esac

repository_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repository_root"

command -v node >/dev/null 2>&1 || {
  echo "Node.js 24 is required." >&2
  exit 1
}

node -e '
  const major = Number.parseInt(process.versions.node.split(".")[0], 10);
  if (major !== 24) {
    console.error(`Node.js 24 is required; found ${process.versions.node}.`);
    process.exit(1);
  }
'

command -v pnpm >/dev/null 2>&1 || {
  echo "pnpm 10.17.0 is required." >&2
  exit 1
}

actual_pnpm_version=$(pnpm --version)
if [ "$actual_pnpm_version" != "10.17.0" ]; then
  echo "pnpm 10.17.0 is required; found $actual_pnpm_version." >&2
  exit 1
fi

pnpm install --frozen-lockfile

if [ "$mode" = "all" ] || [ "$mode" = "checks" ]; then
  pnpm lint
  CI=1 pnpm test --runInBand
fi

if [ "$mode" = "all" ] || [ "$mode" = "build" ]; then
  pnpm build
fi
