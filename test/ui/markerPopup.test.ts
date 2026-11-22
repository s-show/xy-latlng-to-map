import { createSafePopupContent } from '../../src/js/markerPopup.js';

describe('createSafePopupContent', () => {
  test('HTML タグ文字列を DOM 要素ではなくプレーンテキストとして格納する', () => {
    const payload = '<img src=x onerror=alert(1)><script>evil()</script>';
    const element = createSafePopupContent(payload);

    expect(element.tagName).toBe('DIV');
    expect(element.children).toHaveLength(0);
    expect(element.querySelector('img, script')).toBeNull();
    expect(element.textContent).toBe(payload);
  });
});
