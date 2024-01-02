import { extractNumber, dms2deg } from "../js/DMSLatLngParser.js";

test('Split DMS LatLng.', () => {
  expect(extractNumber('139度46分13.6秒')).toStrictEqual([139, 46, 13.6]);
  expect(extractNumber('東経139度46分13.6秒')).toStrictEqual([139, 46, 13.6]);
  expect(extractNumber('139度46分13.6秒')).toStrictEqual([139, 46, 13.6]);
  expect(extractNumber('西経139度46分13.6秒')).toStrictEqual([-139, 46, 13.6]);
  expect(extractNumber('-139度46分13.6秒')).toStrictEqual([-139, 46, 13.6]);
  expect(extractNumber('北緯35度40分39.2秒')).toStrictEqual([35, 40, 39.2]);
  expect(extractNumber('35度40分39.2秒')).toStrictEqual([35, 40, 39.2]);
  expect(extractNumber('南緯35度40分39.2秒')).toStrictEqual([-35, 40, 39.2]);
  expect(extractNumber('-35度40分39.2秒')).toStrictEqual([-35, 40, 39.2]);
  expect(extractNumber('140°49′55″')).toStrictEqual([140, 49, 55]);
  expect(extractNumber('40°46′49″')).toStrictEqual([40, 46, 49]);
  expect(extractNumber('北緯35度39分29秒1572')).toStrictEqual([35, 39, 29.1572]);

  expect(extractNumber('１３９度４６分１３．６秒')).toStrictEqual([139, 46, 13.6]);
  expect(extractNumber('東経１３９度４６分１３．６秒')).toStrictEqual([139, 46, 13.6]);
  expect(extractNumber('１３９度４６分１３．６秒')).toStrictEqual([139, 46, 13.6]);
  expect(extractNumber('西経１３９度４６分１３．６秒')).toStrictEqual([-139, 46, 13.6]);
  expect(extractNumber('－１３９度４６分１３．６秒')).toStrictEqual([-139, 46, 13.6]);
  expect(extractNumber('北緯３５度４０分３９．２秒')).toStrictEqual([35, 40, 39.2]);
  expect(extractNumber('３５度４０分３９．２秒')).toStrictEqual([35, 40, 39.2]);
  expect(extractNumber('南緯３５度４０分３９．２秒')).toStrictEqual([-35, 40, 39.2]);
  expect(extractNumber('－３５度４０分３９．２秒')).toStrictEqual([-35, 40, 39.2]);
  expect(extractNumber('１４０°４９′５５″')).toStrictEqual([140, 49, 55]);
  expect(extractNumber('４０°４６′４９″')).toStrictEqual([40, 46, 49]);
  expect(extractNumber('北緯３５度３９分２９秒１５７２')).toStrictEqual([35, 39, 29.1572]);
});

test('DMS to DEG', () => {
  expect(dms2deg('125度22分56.03秒')).toBe(125.382231);
  expect(dms2deg('東経125度22分56.03秒')).toBe(125.382231);
  expect(dms2deg('139度46分13.6秒')).toBe(139.770444);
  expect(dms2deg('西経139度46分13.6秒')).toBe(-139.770444);
  expect(dms2deg('-149度14分17.81秒')).toBe(-149.238281);
  expect(dms2deg('北緯35度39分53.82秒')).toBe(35.664950);
  expect(dms2deg('35度39分53.82秒')).toBe(35.664950);
  expect(dms2deg('南緯78度32分25.96秒')).toBe(-78.540544);
  expect(dms2deg('-78度32分25.96秒')).toBe(-78.540544);
  expect(dms2deg('140°49′55″')).toBe(140.831944);
  expect(dms2deg('40°46′49″')).toBe(40.780278);

  expect(dms2deg('１３９度４６分１３．６秒')).toBe(139.770444);
  expect(dms2deg('東経１３９度４６分１３．６秒')).toBe(139.770444);
  expect(dms2deg('１３９度４６分１３．６秒')).toBe(139.770444);
  expect(dms2deg('西経１３９度４６分１３．６秒')).toBe(-139.770444);
  expect(dms2deg('－１３９度４６分１３．６秒')).toBe(-139.770444);
  expect(dms2deg('北緯３５度４０分３９．２秒')).toBe(35.677556);
  expect(dms2deg('３５度４０分３９．２秒')).toBe(35.677556);
  expect(dms2deg('南緯３５度４０分３９．２秒')).toBe(-35.677556);
  expect(dms2deg('－３５度４０分３９．２秒')).toBe(-35.677556);
  expect(dms2deg('１４０°４９′５５″')).toBe(140.831944);
  expect(dms2deg('４０°４６′４９″')).toBe(40.780278);
});