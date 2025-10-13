/**
 * XY座標 or 緯度経度として入力された値がシステムで利用可能な値か否か判定する関数
 * 単純な文字コードの値の引き算では対処できない文字で緯度経度で必要となりそうな値は個別に対処している。
 * @param {string} str 確認すべき値
 * @return {str} 全角文字は半角にして返し、半角文字はそのまま返す。
 */
function zen2han(str: string): string {
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

// [[JavaScript] 全角⇔半角の変換を行う（英数字、カタカナ） - YoheiM .NET](https://www.yoheim.net/blog.php?q=20191101)
