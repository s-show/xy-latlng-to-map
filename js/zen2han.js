// [[JavaScript] 全角⇔半角の変換を行う（英数字、カタカナ） - YoheiM .NET](https://www.yoheim.net/blog.php?q=20191101)
// 単純な文字コードの値の引き算では対処できない文字で緯度経度で必要となりそうな値は個別に対処している。
function zen2han(str) {
  str = str.replace('‐', '-');
  str = str.replace('－', '-');
  str = str.replace('ー', '-');
  str = str.replace('―', '-');
  str = str.replace('´', '\'');
  str = str.replace('′', '\'');
  str = str.replace('゛', '"');
  str = str.replace('″', '"');
  str = str.replace('　', ' ');
  return String(str).replace(/[！-～―]/g, function(all) {
		return String.fromCharCode(all.charCodeAt(0) - 0xFEE0);
	});
}

export { zen2han }