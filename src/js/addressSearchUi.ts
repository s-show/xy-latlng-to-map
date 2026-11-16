import { map } from './map.js';
import { searchAddress, AddressSearchResult } from './addressSearch.js';

/*
 * 住所検索（入力した住所を緯度経度に変換して地図の中心に移動する）に関連する処理
 */
export function setupAddressSearch() {
  const addressSearchContainer = document.querySelector<HTMLDivElement>('#address-search');
  const addressSearchForm = document.querySelector<HTMLFormElement>('#address-search-form');
  const addressSearchInput = document.querySelector<HTMLInputElement>('#address-search-input');
  const addressSearchResultsList = document.querySelector<HTMLUListElement>('#address-search-results');
  const addressSearchMessage = document.querySelector<HTMLParagraphElement>('#address-search-message');
  if (
    addressSearchContainer !== null &&
    addressSearchForm !== null &&
    addressSearchInput !== null &&
    addressSearchResultsList !== null &&
    addressSearchMessage !== null
  ) {
    // 住所検索結果を地図に反映する際のズームレベル（初期表示と同じ縮尺）
    const ADDRESS_SEARCH_ZOOM = 15;
    // 現在表示中の候補一覧と、矢印キーで選択中の候補のインデックス（未選択は-1）
    let currentResults: AddressSearchResult[] = [];
    let activeIndex = -1;

    const getAddressSearchOptionId = (index: number) => `address-search-result-${index}`;

    // 矢印キーでの選択状態を候補一覧のハイライトと aria-activedescendant に反映する
    const setActiveAddressSearchIndex = (index: number) => {
      activeIndex = index;
      const items = addressSearchResultsList.querySelectorAll<HTMLLIElement>('li');
      items.forEach((item, i) => {
        const isActive = i === index;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', String(isActive));
        if (isActive) {
          item.scrollIntoView({ block: 'nearest' });
        }
      });
      if (index >= 0) {
        addressSearchInput.setAttribute('aria-activedescendant', getAddressSearchOptionId(index));
      } else {
        addressSearchInput.removeAttribute('aria-activedescendant');
      }
    };

    // 矢印キーでの選択位置を移動する（末尾/先頭で循環する）
    const moveActiveAddressSearchIndex = (delta: 1 | -1) => {
      if (currentResults.length === 0) {
        return;
      }
      const next = activeIndex === -1
        ? (delta > 0 ? 0 : currentResults.length - 1)
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
        const item = document.createElement('li');
        item.id = getAddressSearchOptionId(index);
        item.className = 'list-group-item';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.textContent = result.title;
        // マウスホバーでも矢印キーと同じハイライト状態にする
        item.addEventListener('mouseenter', () => setActiveAddressSearchIndex(index));
        item.addEventListener('click', () => moveMapToAddressResult(result));
        addressSearchResultsList.appendChild(item);
      });
      addressSearchResultsList.classList.remove('visually-hidden');
      addressSearchInput.setAttribute('aria-expanded', 'true');
      setActiveAddressSearchIndex(-1);
      // 検索ボタンのクリックで送信した場合にフォーカスがボタン側に残ると矢印キーが効かないため、
      // 候補表示時は入力欄にフォーカスを戻す（ARIA combobox パターンでは実フォーカスを入力欄に保つ）
      addressSearchInput.focus();
    };

    // 入力された住所を検索し、1件のみ該当した場合は即座に地図を移動、
    // 複数該当した場合は候補一覧から選ばせる
    const runAddressSearch = async () => {
      const query = addressSearchInput.value.trim();
      hideAddressSearchMessage();
      hideAddressSearchResults();
      if (query === '') {
        return;
      }
      try {
        const results = await searchAddress(query);
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

    addressSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      void runAddressSearch();
    });

    // 候補一覧を矢印キーで選択するための処理（ARIA combobox パターン）
    addressSearchInput.addEventListener('keydown', (e) => {
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
          // 候補を選択中の場合はそれを確定し、通常のフォーム送信（再検索）は行わない
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
    });

    // 検索欄の外側をクリックしたら候補一覧を閉じる
    document.addEventListener('click', (e) => {
      if (e.target instanceof Node && !addressSearchContainer.contains(e.target)) {
        hideAddressSearchResults();
      }
    });
  }
}
