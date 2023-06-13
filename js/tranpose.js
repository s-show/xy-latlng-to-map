// [JavaScriptで二次元配列の行列を転置するワンライナー - Qiita](https://qiita.com/kznrluk/items/790f1b154d1b6d4de398)
// 多次元配列の組み換え関数
//const array = [
//  [ 1, 2, 3 ],
//  [ 4, 5, 6 ],
//  [ 7, 8, 9 ]
//];
//transpose(array);
// ↓
//[
//    [ 1, 4, 7 ],
//    [ 2, 5, 8 ],
//    [ 3, 6, 9 ]
//]
const transpose = array => array[0].map((_, c) => array.map(r => r[c]));

export { transpose };