import { isNearlyEqual } from "../js/nearlyEqual";

test('test nearly equal', () => {
  expect(isNearlyEqual(34.04447459433428, 34.04447459433429)).toBe(true);
  expect(isNearlyEqual(34.04447459433428, 34.04447459433429, 0)).toBe(false);
  expect(isNearlyEqual('34.04447459433428', '34.04447459433429')).toBe(true);
  expect(isNearlyEqual(34.04447459433428, 34.04447459433431)).toBe(false);
  expect(isNearlyEqual(34.04447459433428, 34.04447459433431, 2.0E-13)).toBe(true);
  expect(isNearlyEqual(34.04447459433428, 34.04447459433431, 2.0E-15)).toBe(false);
  expect(isNearlyEqual(1.0, 1.1)).toBe(false);
  expect(isNearlyEqual(0, 1.1)).toBe(false);
  expect(isNearlyEqual(1, 0)).toBe(false);
  expect(isNearlyEqual(1.0, 1.1, 0)).toBe(false);
  expect(isNearlyEqual('a', 'b',  'c')).toBe(false);
  expect(isNearlyEqual(0,   'b',  'c')).toBe(false);
  expect(isNearlyEqual('a', 1.0,  'c')).toBe(false);
  expect(isNearlyEqual('a', 'b',  0.1)).toBe(false);
  expect(isNearlyEqual('a', 1,    0.1)).toBe(false);
  expect(isNearlyEqual(1.1, 'b',  0.1)).toBe(false);
  expect(isNearlyEqual(1.0, 1.1, 'c')).toBe(false);
});
