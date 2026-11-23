import { jest } from '@jest/globals';
import type { WorksheetInstance } from 'jspreadsheet-ce';
import { bootstrapApp } from '../../src/js/index.js';
import type { AppTables } from '../../src/js/jspreadsheet.js';

function createStubTables(): AppTables {
  const createWorksheet = () =>
    ({
      getData: jest.fn(() => [['35.658', '139.745', 'memo']]),
      setData: jest.fn(),
      setWidth: jest.fn(),
      hideIndex: jest.fn(),
      showIndex: jest.fn(),
    }) as unknown as WorksheetInstance;

  return {
    sourceTable: [createWorksheet()],
    convertedTable: [createWorksheet()],
    clearTable: jest.fn(),
    resizeTable: jest.fn(),
    dispose: jest.fn(),
  };
}

const MINIMAL_APP_HTML = `
  <div class="map-container"><div id="map"></div></div>
  <div id="source-data-table"></div>
  <div id="converted-data-table"></div>
  <select id="select-marker-icon"><option value="red" selected>赤</option></select>
  <select id="select-line-color"><option value="no" selected>線無し</option></select>
  <button id="add-marker-btn" type="button">追加</button>
  <button id="remove-marker-btn" type="button">削除</button>
  <div id="error-message-wrap" class="visually-hidden"><p id="error-message"></p></div>
`;

describe('bootstrapApp lifecycle', () => {
  beforeEach(() => {
    document.body.innerHTML = MINIMAL_APP_HTML;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('同一コンテナへの二重初期化を拒否し、dispose 後は再初期化できる', () => {
    const app1 = bootstrapApp({
      createTables: () => createStubTables(),
      reinfolibProxyUrl: '',
      googleMapsApiKey: '',
    });

    expect(() =>
      bootstrapApp({
        createTables: () => createStubTables(),
        reinfolibProxyUrl: '',
        googleMapsApiKey: '',
      }),
    ).toThrow(/already initialized/i);

    app1.dispose();

    const app2 = bootstrapApp({
      createTables: () => createStubTables(),
      reinfolibProxyUrl: '',
      googleMapsApiKey: '',
    });
    expect(app2.map).toBeDefined();
    app2.dispose();
  });
});
