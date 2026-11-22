import L from 'leaflet';
import { searchAddress, AddressSearchResult } from './addressSearch.js';

export interface AddressSearchUiOptions {
  readonly doc?: Document;
  readonly search?: (query: string) => Promise<AddressSearchResult[]>;
}

/**
 * 住所入力欄から国土地理院の住所検索APIを使って緯度経度を取得し、地図中心を移動する UI を初期化する。
 * 返り値の関数を呼ぶと登録したイベントリスナーをすべて解除できる。
 */
export function setupAddressSearch(map: L.Map, options: AddressSearchUiOptions = {}): () => void {
  const doc = options.doc ?? document;
  const search = options.search ?? searchAddress;
  const controller = new AbortController();
  const { signal } = controller;

  const addressSearchContainer = doc.querySelector<HTMLDivElement>('#address-search');
  const addressSearchForm = doc.querySelector<HTMLFormElement>('#address-search-form');
  const addressSearchInput = doc.querySelector<HTMLInputElement>('#address-search-input');
  const addressSearchResultsList = doc.querySelector<HTMLUListElement>('#address-search-results');
  const addressSearchMessage = doc.querySelector<HTMLParagraphElement>('#address-search-message');

  if (
    addressSearchContainer !== null &&
    addressSearchForm !== null &&
    addressSearchInput !== null &&
    addressSearchResultsList !== null &&
    addressSearchMessage !== null
  ) {
    const ADDRESS_SEARCH_ZOOM = 15;
    let currentResults: AddressSearchResult[] = [];
    let activeIndex = -1;

    const getAddressSearchOptionId = (index: number) => `address-search-result-${index}`;

    const setActiveAddressSearchIndex = (index: number) => {
      activeIndex = index;
      const items = addressSearchResultsList.querySelectorAll<HTMLLIElement>('li');
      items.forEach((item, i) => {
        const isActive = i === index;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', String(isActive));
        if (isActive && typeof item.scrollIntoView === 'function') {
          item.scrollIntoView({ block: 'nearest' });
        }
      });
      if (index >= 0) {
        addressSearchInput.setAttribute('aria-activedescendant', getAddressSearchOptionId(index));
      } else {
        addressSearchInput.removeAttribute('aria-activedescendant');
      }
    };

    const moveActiveAddressSearchIndex = (delta: 1 | -1) => {
      if (currentResults.length === 0) {
        return;
      }
      const next =
        activeIndex === -1
          ? delta > 0
            ? 0
            : currentResults.length - 1
          : (activeIndex + delta + currentResults.length) % currentResults.length;
      setActiveAddressSearchIndex(next);
    };

    const hideAddressSearchResults = () => {
      addressSearchResultsList.replaceChildren();
      addressSearchResultsList.classList.add('visually-hidden');
      addressSearchInput.setAttribute('aria-expanded', 'false');
      addressSearchInput.removeAttribute('aria-activedescendant');
      currentResults = [];
      activeIndex = -1;
    };

    const showAddressSearchMessage = (message: string) => {
      addressSearchMessage.textContent = message;
      addressSearchMessage.classList.remove('visually-hidden');
    };

    const hideAddressSearchMessage = () => {
      addressSearchMessage.textContent = '';
      addressSearchMessage.classList.add('visually-hidden');
    };

    const moveMapToAddressResult = (result: AddressSearchResult) => {
      map.setView([result.lat, result.lng], ADDRESS_SEARCH_ZOOM);
      addressSearchInput.value = result.title;
      hideAddressSearchResults();
      hideAddressSearchMessage();
    };

    const renderAddressSearchResults = (results: AddressSearchResult[]) => {
      currentResults = results;
      addressSearchResultsList.replaceChildren();
      results.forEach((result, index) => {
        const item = doc.createElement('li');
        item.id = getAddressSearchOptionId(index);
        item.className = 'list-group-item';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.textContent = result.title;
        item.addEventListener('mouseenter', () => setActiveAddressSearchIndex(index));
        item.addEventListener('click', () => moveMapToAddressResult(result));
        addressSearchResultsList.appendChild(item);
      });
      addressSearchResultsList.classList.remove('visually-hidden');
      addressSearchInput.setAttribute('aria-expanded', 'true');
      setActiveAddressSearchIndex(-1);
      addressSearchInput.focus();
    };

    const runAddressSearch = async () => {
      const query = addressSearchInput.value.trim();
      hideAddressSearchMessage();
      hideAddressSearchResults();
      if (query === '') {
        return;
      }
      try {
        const results = await search(query);
        if (results.length === 0) {
          showAddressSearchMessage('該当する住所が見つかりませんでした');
        } else if (results.length === 1) {
          moveMapToAddressResult(results[0]);
        } else {
          renderAddressSearchResults(results);
        }
      } catch (error) {
        showAddressSearchMessage('住所検索に失敗しました。しばらくしてから再度お試しください');
        console.warn('住所検索に失敗しました:', error);
      }
    };

    addressSearchForm.addEventListener(
      'submit',
      (e) => {
        e.preventDefault();
        void runAddressSearch();
      },
      { signal },
    );

    addressSearchInput.addEventListener(
      'keydown',
      (e) => {
        if (currentResults.length === 0) {
          return;
        }
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            moveActiveAddressSearchIndex(1);
            break;
          case 'ArrowUp':
            e.preventDefault();
            moveActiveAddressSearchIndex(-1);
            break;
          case 'Enter':
            if (activeIndex >= 0) {
              e.preventDefault();
              moveMapToAddressResult(currentResults[activeIndex]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            hideAddressSearchResults();
            break;
          default:
            break;
        }
      },
      { signal },
    );

    doc.addEventListener(
      'click',
      (e) => {
        if (e.target instanceof Node && !addressSearchContainer.contains(e.target)) {
          hideAddressSearchResults();
        }
      },
      { signal },
    );
  }

  return () => {
    controller.abort();
  };
}
