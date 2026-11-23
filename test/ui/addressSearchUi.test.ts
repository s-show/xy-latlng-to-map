import { jest } from '@jest/globals';
import L from 'leaflet';
import { waitFor } from '@testing-library/dom';
import { setupAddressSearch } from '../../src/js/addressSearchUi.js';

const SEARCH_HTML = `
  <div id="map"></div>
  <div id="address-search">
    <form id="address-search-form">
      <input type="search" id="address-search-input" role="combobox" aria-expanded="false" />
      <button type="submit">検索</button>
    </form>
    <ul id="address-search-results" class="visually-hidden" role="listbox"></ul>
    <p id="address-search-message" class="visually-hidden" role="status"></p>
  </div>
`;

describe('setupAddressSearch (decoupled)', () => {
  let map: L.Map;
  let dispose: () => void;

  beforeEach(() => {
    document.body.innerHTML = SEARCH_HTML;
    map = L.map(document.getElementById('map')!).setView([35.658, 139.741], 15);
  });

  afterEach(() => {
    dispose?.();
    map.remove();
    document.body.innerHTML = '';
  });

  test('複数候補をリスト表示し、ArrowDown + Enter で選択した地点へ地図を移動する', async () => {
    const setViewSpy = jest.spyOn(map, 'setView');
    dispose = setupAddressSearch(map, {
      search: async () => [
        { title: '東京都港区芝公園一丁目', lat: 35.6553, lng: 139.7484 },
        { title: '東京都港区芝公園二丁目', lat: 35.6542, lng: 139.7495 },
      ],
    });

    const input = document.querySelector<HTMLInputElement>('#address-search-input')!;
    const form = document.querySelector<HTMLFormElement>('#address-search-form')!;
    const list = document.querySelector<HTMLUListElement>('#address-search-results')!;

    input.value = '芝公園';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await waitFor(() => {
      expect(list.querySelectorAll('li')).toHaveLength(2);
    });

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));

    expect(setViewSpy).toHaveBeenCalledWith([35.6553, 139.7484], 15);
    expect(input.value).toBe('東京都港区芝公園一丁目');
    expect(list.querySelectorAll('li')).toHaveLength(0);
  });

  test('検索結果が 0 件のときは案内メッセージを表示する', async () => {
    dispose = setupAddressSearch(map, {
      search: async () => [],
    });

    const input = document.querySelector<HTMLInputElement>('#address-search-input')!;
    const form = document.querySelector<HTMLFormElement>('#address-search-form')!;
    const message = document.querySelector<HTMLParagraphElement>('#address-search-message')!;

    input.value = '存在しない場所';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await waitFor(() => {
      expect(message).not.toHaveClass('visually-hidden');
      expect(message.textContent).toContain('該当する住所が見つかりませんでした');
    });
  });
});
