export const ICON_COLORS = ['red', 'blue', 'yellow', 'green'] as const;
export type IconColor = (typeof ICON_COLORS)[number];

export function isIconColor(value: unknown): value is IconColor {
  return typeof value === 'string' && ICON_COLORS.some((color) => color === value);
}

export const LINE_COLOR_NAMES = ['red', 'blue', 'yellow', 'green'] as const;
export type LineColorName = (typeof LINE_COLOR_NAMES)[number];

export function isLineColorName(value: unknown): value is LineColorName {
  return typeof value === 'string' && LINE_COLOR_NAMES.some((color) => color === value);
}

export const LINE_COLORS: ReadonlyMap<LineColorName, string> = new Map<LineColorName, string>([
  ['red', '#ff4500'],
  ['blue', '#1e90ff'],
  ['yellow', '#FFDF00'],
  ['green', '#006400'],
]);

// 線の色に「線無し」を選んでいても、円には輪郭線が必要
export const DEFAULT_CIRCLE_LINE_COLOR = '#8b4513';
