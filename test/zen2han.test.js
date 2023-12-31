import { zen2han } from "../js/zen2han.js";

test('全角文字は半角に、半角文字はそのままに', () => {
  expect(zen2han('1')).toBe('1');
  expect(zen2han('１')).toBe('1');
  expect(zen2han('1.1')).toBe('1.1');
  expect(zen2han('１．１')).toBe('1.1');
  expect(zen2han('1．１')).toBe('1.1');
  expect(zen2han('１．1')).toBe('1.1');
  expect(zen2han('１.１')).toBe('1.1');
  expect(zen2han('+1.1')).toBe('+1.1');
  expect(zen2han('＋1.1')).toBe('+1.1');
  expect(zen2han('+１．１')).toBe('+1.1');
  expect(zen2han('+1．１')).toBe('+1.1');
  expect(zen2han('+１.１')).toBe('+1.1');
  expect(zen2han('+１．1')).toBe('+1.1');
  expect(zen2han('＋１．１')).toBe('+1.1');
  expect(zen2han('＋1．１')).toBe('+1.1');
  expect(zen2han('＋１.１')).toBe('+1.1');
  expect(zen2han('＋１．1')).toBe('+1.1');
  expect(zen2han('0.1')).toBe('0.1');
  expect(zen2han('０．１')).toBe('0.1');
  expect(zen2han('0')).toBe('0');
  expect(zen2han(' ')).toBe(' ');
  expect(zen2han('b')).toBe('b');
  expect(zen2han('')).toBe('');
  expect(zen2han('　')).toBe(' ');
  expect(zen2han('０')).toBe('0');
  expect(zen2han('－')).toBe('-');
  expect(zen2han('‐')).toBe('-');
  expect(zen2han('－')).toBe('-');
  expect(zen2han('ｂ')).toBe('b');
  expect(zen2han('―')).toBe('-');
  expect(zen2han('１,１')).toBe('1,1');
  expect(zen2han('１，１')).toBe('1,1');
  expect(zen2han('゜')).toBe('゜');
  expect(zen2han('°')).toBe('°');
  expect(zen2han('′')).toBe('\'');
  expect(zen2han('´')).toBe('\'');
  expect(zen2han('゛')).toBe('"');
  expect(zen2han('″')).toBe('"');
});