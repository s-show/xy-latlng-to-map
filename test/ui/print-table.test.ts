/**
 * Issue #11: 印刷時の表非表示・レイアウト切替の DOM/挙動テスト
 */
import { jest } from '@jest/globals';
import L from 'leaflet';
import { setupPrint } from '../../src/js/print.js';

const TABLES_HTML = `
  <div id="sourceDataTable" class="d-print-none"></div>
  <div id="convertedDataTable" class="d-print-none"></div>
  <div class="map-container"><div id="map"></div></div>
  <div>
    <input type="radio" name="source-data-type" value="XY" checked />
  </div>
  <div>
    <input type="radio" name="source-data-type" value="latlng" />
  </div>
`;

describe('Issue #11: 印刷時の表非表示と setupPrint', () => {
  beforeEach(() => {
    document.body.innerHTML = TABLES_HTML;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('入力表・変換結果表が印刷対象外クラスを持つ', () => {
    const source = document.getElementById('sourceDataTable');
    const converted = document.getElementById('convertedDataTable');
    expect(source).toHaveClass('d-print-none');
    expect(converted).toHaveClass('d-print-none');
  });

  it('setupPrint は beforeprint / afterprint で要素表示と印刷寸法を切り替え、dispose で解除できる', () => {
    const map = L.map(document.getElementById('map')!).setView([35.658, 139.741], 15);
    const invalidateSpy = jest.spyOn(map, 'invalidateSize');
    const sourceTable = {
      setWidth: jest.fn(),
      hideIndex: jest.fn(),
      showIndex: jest.fn(),
    };
    const dispose = setupPrint({ map, sourceTable });

    try {
      window.dispatchEvent(new Event('beforeprint'));
      expect(sourceTable.hideIndex).toHaveBeenCalledTimes(1);
      expect(document.getElementById('sourceDataTable')).toHaveClass('d-none');
      expect(document.querySelector<HTMLElement>('.map-container')?.style.width).toBe('277mm');
      expect(invalidateSpy).toHaveBeenCalled();

      window.dispatchEvent(new Event('afterprint'));
      expect(sourceTable.showIndex).toHaveBeenCalledTimes(1);
      expect(document.getElementById('sourceDataTable')).not.toHaveClass('d-none');
      expect(document.querySelector<HTMLElement>('.map-container')?.style.width).toBe('');

      dispose();
      window.dispatchEvent(new Event('beforeprint'));
      expect(sourceTable.hideIndex).toHaveBeenCalledTimes(1);
    } finally {
      dispose();
      map.remove();
    }
  });
});
