import { isImageFile } from '../src/js/isImageFile.js';

describe('isImageFile: 画像ファイルの判定', () => {
  it('image/jpeg を画像と判定する', () => {
    expect(isImageFile(new File([], 'a.jpg', { type: 'image/jpeg' }))).toBe(true);
  });
  it('image/png を画像と判定する', () => {
    expect(isImageFile(new File([], 'a.png', { type: 'image/png' }))).toBe(true);
  });
  it('image/heic を画像と判定する', () => {
    expect(isImageFile(new File([], 'a.heic', { type: 'image/heic' }))).toBe(true);
  });
  it('text/csv を画像と判定しない', () => {
    expect(isImageFile(new File([], 'a.csv', { type: 'text/csv' }))).toBe(false);
  });
  it('application/pdf を画像と判定しない', () => {
    expect(isImageFile(new File([], 'a.pdf', { type: 'application/pdf' }))).toBe(false);
  });
  it('type が空文字のファイルを画像と判定しない', () => {
    expect(isImageFile(new File([], 'a.unknown', { type: '' }))).toBe(false);
  });
});
