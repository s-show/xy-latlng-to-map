import { arrayToCSV, exportCSV, getArrayDepth } from "../js/exportCSV";

const test1 = [
  ['1', '2'], ['3', '4'], ['5', '6'],
]
const test2 = [
  ['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'],
]
const test3 = [
  ['a', 'b'], ['c', 'd'], ['e', 'f'],
]
const test4 = [
  ['', 'b'], ['c', ''], ['', 'f'],
]
const test5 = {
  data: [
    ['', 'b'], ['c', ''], ['', 'f']
  ]
}
const test6 = [
  [
    [1,2], [3,4]
  ]
]

test('array to csv', () => {
  expect(arrayToCSV(test1)).toEqual('1,2\n3,4\n5,6');
  expect(arrayToCSV(test2)).toEqual('1,2,3\n4,5,6\n7,8,9');
  expect(arrayToCSV(test3)).toEqual('a,b\nc,d\ne,f');
  expect(arrayToCSV(test4)).toEqual(',b\nc,\n,f');
  expect(arrayToCSV('hoge')).toBeFalsy();
  expect(arrayToCSV(test5)).toBeFalsy();
});

test('check array depth', () => {
  expect(getArrayDepth([1,2,3])).toBe(1);
  expect(getArrayDepth(test1)).toBe(2);
  expect(getArrayDepth(test6)).toBe(3);
  expect(getArrayDepth([1,2,[3,4,[5,6],7,[8,[9,91]],10],11,12])).toBe(4);
  expect(getArrayDepth('hoge')).toBe(0);
  expect(getArrayDepth(test5)).toBe(0);
  expect(getArrayDepth([{'a':1, 'b':2,'c': 3}])).toBe(1);
  expect(getArrayDepth({'a':1, 'b':2,'c': 3})).toBe(0);
});