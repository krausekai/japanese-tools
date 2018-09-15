/*
	MIT License
	Copyright (c) 2018 Kai Krause <kaikrause95@gmail.com>
	See license here: https://github.com/krausekai/Japanese-Known-Word-Checker/blob/master/LICENSE.txt
*/

var _debug = false;

var knownWordsArr = [];
function loadKnownWordsList() {
	try {
		var storedKnownWordsArr = JSON.parse(localStorage.getItem("knownWordsArr"));
		if (storedKnownWordsArr && storedKnownWordsArr.length >= 1) {
			knownWordsArr = storedKnownWordsArr;
			var isFileSavedField = document.getElementById("isFileSaved");
			isFileSavedField.textContent = "Known Words Have Been Loaded from Last Session";
		}
	} catch (e) {
		console.error(e);
	}
}
// TODO: Option to optimize word list and LocalStorage limitation by only storing the delimited column
function saveKnownWordsList() {
	let rememberSettingsChecked = document.getElementById("rememberSettingsCheck").checked;
	if (rememberSettingsChecked) {
		if (knownWordsArr && knownWordsArr.length >= 1) {
			localStorage.setItem("knownWordsArr", JSON.stringify(knownWordsArr));
		}
	}
}
async function processKnownWordsFile() {
	return new Promise((resolve, reject) => {
		var knownWordsFileInput = document.getElementById("fileInput");
		var file = knownWordsFileInput.files[0];

		var textType = /text.*/;
		if (file.type && !file.type.match(textType)) {
			window.alert("File type not supported!");
			reject();
		}
		// CSV extension detection bug (eg. Firefox 60, file type is undefined)
		else if (!file.type && !knownWordsFileInput.value.endsWith == ".csv") {
			window.alert("File type not supported!");
			reject();
		}

		var reader = new FileReader();
		reader.onload = function(e) {
			// Split on new lines and assign the result
			knownWordsArr = reader.result.split(/\r?\n/);
			// Resave known words list
			saveKnownWordsList();
			// Return the result
			resolve(knownWordsArr);
		}
		reader.readAsText(file);
	});
}

var delimiter = "";
function loadDelimiter() {
	let storedDelimiter = JSON.parse(localStorage.getItem("delimiter"));
	let delimiterField = document.getElementById("delimiterField");
	if (storedDelimiter) {
		delimiter = storedDelimiter;
		if (storedDelimiter === "	") delimiterField.value = "\\t"; // Show tab space as an actual tab identifier to the user
		else delimiterField.value = delimiter;
	}
}
function saveDelimiter() {
	let delimiterFieldVal = document.getElementById("delimiterField").value;
	if (delimiterFieldVal && delimiterFieldVal === "\\t") delimiterFieldVal = "\t"; // tab character \t will escape internally to \\t, so change back to \t
	let rememberSettingsChecked = document.getElementById("rememberSettingsCheck").checked;
	if (rememberSettingsChecked) {
		localStorage.setItem("delimiter", JSON.stringify(delimiterFieldVal));
		delimiter = delimiterFieldVal;
	}
	else {
		delimiter = delimiterFieldVal;
	}
}

var column = 0;
function loadColumn() {
	let storedColumn = parseInt(localStorage.getItem("column"));
	let columnField = document.getElementById("columnField");
	if (storedColumn != null && storedColumn != "undefined") {
		column = storedColumn;
		columnField.value = column;
	}
}
function saveColumn() {
	let columnFieldVal = parseInt(document.getElementById("columnField").value);
	if (!Number.isInteger(parseInt(columnFieldVal))) {
		return window.alert("Column must be a number!");
	}
	let rememberSettingsChecked = document.getElementById("rememberSettingsCheck").checked;
	if (rememberSettingsChecked) {
		localStorage.setItem("column", columnFieldVal);
		column = columnFieldVal;
	}
	else {
		column = columnFieldVal;
	}
}

function loadSettings() {
	loadKnownWordsList();
	loadDelimiter();
	loadColumn();
}
function saveSettings() {
	saveKnownWordsList();
	saveDelimiter();
	saveColumn();
}
function removeSettings() {
	localStorage.removeItem("knownWordsArr");
	localStorage.removeItem("delimiter");
	localStorage.removeItem("column");
}

var loaded = false;
function rememberSettings() {
	// Get checkbox settings
	let rememberSettingsCheckField = document.getElementById("rememberSettingsCheck");
	let rememberSettingsCheckStored = localStorage.getItem("rememberSettingsCheck");
	if (!loaded && rememberSettingsCheckStored) {
		// Coerce string back to boolean as checkfield value
		if (rememberSettingsCheckStored === "true") rememberSettingsCheckStored = true;
		else if (rememberSettingsCheckStored === "false") rememberSettingsCheckStored = false;
		// Set checkbox setting
		rememberSettingsCheckField.checked = rememberSettingsCheckStored;
		// Load settings
		if (rememberSettingsCheckStored) loadSettings();
		// Prevent this from running again
		loaded = true;
	}

	// Save current checkbox setting
	localStorage.setItem("rememberSettingsCheck", rememberSettingsCheckField.checked);

	// Save settings OR assign internal variables
	saveSettings();

	// Remove saved settings
	if (!rememberSettingsCheckField.checked) removeSettings();
}

window.onload = function() {
	// Manage settings
	window.addEventListener("change", rememberSettings);
	rememberSettings();

	// Manage known words file loading
	let knownWordsFileInput = document.getElementById("fileInput");
	knownWordsFileInput.addEventListener("change", processKnownWordsFile);

	// Manage comparison text processing
	let comparisonTextInput = document.getElementById("comparisonTextInput");
	comparisonTextInput.addEventListener("change", processComparisonText);
	processComparisonText();

	// Manage comparison processing
	let compareBtn = document.getElementById("compareBtn");
	compareBtn.addEventListener("click", compare);

	// Manage new words toggle view
	let newWordsToggleBtn = document.getElementById("toggleNewWordsViewBtn");
	newWordsToggleBtn.addEventListener("click", () => {
		let newWordsHtmlWrap = document.getElementById("newWordsHtmlWrap");
		let newWordsTextWrap = document.getElementById("newWordsTextWrap");
		if (newWordsHtmlWrap.style.display === "block" || newWordsHtmlWrap.style.display === "") {
			newWordsHtmlWrap.style.display = "none";
			newWordsTextWrap.style.display = "block";
		}
		else if (newWordsTextWrap.style.display === "block" || newWordsTextWrap.style.display === "") {
			newWordsHtmlWrap.style.display = "block";
			newWordsTextWrap.style.display = "none";
		}
	})
}

/* Return a unique array - Source: https://stackoverflow.com/a/9229821 */
function uniq_fast(a) {
	var seen = {};
	var out = [];
	var len = a.length;
	var j = 0;
	for(var i = 0; i < len; i++) {
		var item = a[i];
		if(seen[item] !== 1) {
		seen[item] = 1;
		out[j++] = item;
		}
	}
	return out;
}

var segmenter = new TinySegmenter();
var segs = [];
var termsToReplace = /または|又は|ことを|のを|を|とき|くらい|ぐらい|ほど|ほぼ|からも|まで|より|など|とか|ということです|ことです|ことで|ことだ|こと|もの|だろう|だろ|でしょう|でしょ|みましょう|しょう|みよう|による|によれば|よる|によります|よります|によって|よって|について|ついて|についた|に対して|に対し|における|ばかり|ありながら|ながら|ながら|為にも|為に|ためにも|ために|ための|為|ため|しよう|みよう|ふうに|ように|ような|よう|みたいな|みたい|けれど|けど|ですが|なんですが|のですが|んです|のです|のでした|でした|です|だから|なので|ので|なんだった|なんだ|んだった|んだ|のだった|だった|のだ|っす|いる|いられない|いない|います|いません|ある|あって|あったら|あった|あります|ありました|ありません|おる|おります|しまう|しまって|しまった|しまえ|しまい|ヤっちゃう|ちゃう|ちゃって|ちゃった|ちゃい|ください|下さい|くださる|下さる|宜しくお願いします|よろしくおねがいします|宜しく|よろしく|お願い|願い|こそ|する|したい|したかった|こうした|そうした|しろよ|やる|やれた|やりたい|やりたかった|ヤリたい|ヤリたかった|やれる|やって|やったら|やった|ヤる|ヤレる|ヤれる|やります|やりました|はず|筈|わけ|訳|くれる|くれて|くれた|くれれば|くれます|くれました|くれません|くれませ|くれ|あげる|あげない|あげれる|あげた|あげて|あげます|あげまして|あげました|貰う|貰え|もらう|もらえる|もらえ|もらって|もらった|もらい|いただく|いただきたい|いただいた|いただいて|頂く|頂いた|頂きたい|頂い|頂き|いただき|のじゃない|んじゃない|のじゃん|んじゃん|じゃない|じゃありません|じゃあ|じゃ|いたら|たら|んだら|だら|として|にとって|において|おいた|なさい|いかない|いいか|良いか|いい|イイ|よい|良い|よくて|良くて|よかった|良かった|よければ|良ければ|よく|良く|よろしい|ありがとうざいました|ありがとう|ございます|ございました|たりする|たりしない|したり|たり|だり|だし|される|されて|された|され|させる|させて|ってのは|こういう|そういう|どういう|こういった|そういった|という|といった|といって|と言って|と言ったら|と言った|って言う|っていう|ってゆう|って言われた|って言われ|って言える|って思う|って思っていた|って思っている|って思って|って思った|と思う|と思っていた|と思っている|と思って|と思った|と思います|と思っていました|と思っています|と思いました|って思い|と思い|思う|思います|かける|かけた|かけていた|かけている|かけて|かかる|かかった|かかっていた|かかっている|かかって|なければいけない|なければならない|ならない|なきゃいけない|いけない|いけません|いける|このまま|そのまま|あそこの|そこの|ここの|ってこと|にした|にしました|にして|にしてた|にしていた|になる|となる|なる|なりたい|なりたくない|なれる|となります|になります|なります|なりません|なった|なって|なりました|なりまして|なりたくて|なれない|なくなり|ことが|ことは|のが|のは|できる|できて|できた|できます|できました|できません|できれば|できない|できなかった|できなければ|できなくて|できなく|できなさそう|ほうが|のうちに|のうち|うち|やめる|やめて|やめた|やめます|やめました|これから|これら|これは|これが|これ|コレ|それぞれ|それから|それら|それとも|それが|それは|それ|ソレ|あれら|あれ|この|その|こんな|そんな|あんな|どんな|どの|あの|ここに|ここ|ココ|そこに|そこ|あそこに|あそこ|こちら|こっち|そっち|あっち|どこ|こちら|そちら|どちらとも|どちら|どっち|どれ|どうして|どう|だれ|みんな|みなさん|皆さま|皆|誰|どなたか|どなた|彼ら|僕ら|俺ら|おれら|ひとたち|わたしたち|私たち|私達|彼たち|かれたち|僕たち|ぼくたち|俺たち|おれたち|君たち|きみたち|俺達|僕達|あなた|貴方|自分|私|僕|俺|貴方|貴方方|我々|私達|あの人|あのかた|我ら|わたしたち|お前たち|お前ら|お前|おまえ|それで|しかし|そして|そしたら|さらに|すでに|共に|ともに|とも|一緒に|一緒|いっしょに|やつ|ヤツ|ちょっと|そのうえ|なぜ|なんで|ほとんど|なお|まだ|未だ|やばい|ヤバイ|だって|及び|および|ちなみに|ちなみ|またすぐ|また|すぐに|すぐ|わかりやすく|わかる|とわかって|がわかって|わかった|分かる|分かった|わからない|わからなく|分からなく|分からない|わかります|わかりません|わかりました|分かります|分かりません|分かりました|こんにちは|こんにちわ|こんばんは|こんばんわ|全て|すべて|全部|ぜんぶ|凄い|すごい|すっごい|すごく|すっごく|凄く|スゴイ|やすい|にくい|づらい|つらい|なかなか|例えば|例え|たとえ|ところ|はじめて|はじめる|始める|始めて|初める|初めて|ほしい|欲しい|欲しそう|かもしれない|かもしれません|過ぎる|すぎる|過ぎない|すぎない|やりすぎ|だけだ|だけでなく|だけでも|ひとり|一人|二人|ひとつ|一つ|他に|ほかに|少し|すこし|みてね|くる|きた|いく|だね|のさ|での|もう|いつ|どこ|なんて|ひらがな|かたかな|カタカナ|にせず|かと|かを|には|とは|との|へと|への|べき|べく|上で|うえで|前に|後に|しかない|“|、|。|…|「|」|×|{|}/;
//あまり|あんまり|もっと|いっぱい|たくさん|とても|かなり|もちろん|つもり
var termsToReplaceRegex = new RegExp(termsToReplace, "g");
var alphaRegex = new RegExp(/[a-zA-Z]+/, "g");
var numberRegex = new RegExp(/(\d+)/, "g");
var newLineRegex = new RegExp(/\n+/, "g");
var katakanaRegex = new RegExp(/([\u30a0-\u30ff])(い|る)/, "g");
var honKanjiRegex = new RegExp(/((お|ご)[\u4e00-\u9faf\u3400-\u4dbf])/, "g"); // お/ご+Kanji unicode
var verbRegex = new RegExp(/([\u4e00-\u9faf\u3400-\u4dbf])([\u3040-\u309f]|)(む|ぐ|る|す|つ|ぬ|ぶ|う)/, "g"); // Kanji unicode+む/く/る/す
var verbKuSaBeforeNRegex = new RegExp(/([\u4e00-\u9faf\u3400-\u4dbf])([\u3040-\u309f]|)(く|さ)(?!ん)(?:([\u4e00-\u9faf\u3400-\u4dbf]))/, "g"); // Kanji+く/さ not before ん (eg. ~田中さん / 白さ~)
var verbTeRegex = new RegExp(/(む|く|ぐ|る|す|つ|ぬ|ぶ)(って|っと)/, "g"); // る+って
var verbTeFormRegex = new RegExp(/(って|んで|っと)/, "g"); // te form verbs
var verbAuxRegex = new RegExp(/(くありません|いましょう|きましょう|ぎましょう|しましょう|ちましょう|にましょう|びましょう|みましょう|りましょう|いじゃう|いすぎる|いちゃう|いなさい|いました|いません|かったら|かったり|きすぎる|ぎすぎる|きちゃう|きなさい|ぎなさい|きました|ぎました|きません|ぎません|こさせる|こられる|しすぎる|しちゃう|しなさい|しました|しません|ちすぎる|ちなさい|ちました|ちません|っちゃう|にすぎる|になさい|にました|にません|びすぎる|びなさい|びました|びません|ましょう|みすぎる|みなさい|みました|みません|りすぎる|りなさい|りました|りません|んじゃう|いそう|いたい|いたら|いだら|いたり|いだり|います|かせる|がせる|かった|かない|がない|かれる|がれる|きそう|ぎそう|きたい|ぎたい|きたら|きたり|きます|ぎます|くない|ければ|こない|こよう|これる|させる|さない|される|しそう|したい|したら|したり|しない|します|しよう|すぎる|たせる|たない|たれる|ちそう|ちたい|ちます|ちゃう|ったら|ったり|なさい|なせる|なない|なれる|にそう|にたい|にます|ばせる|ばない|ばれる|びそう|びたい|びます|ました|ませる|ません|まない|まれる|みそう|みたい|みます|らせる|らない|られる|りそう|りたい|ります|わせる|わない|われる|んだら|んだり|いた|いだ|いて|いで|えば|える|おう|かず|がず|きた|きて|くて|けば|げば|ける|げる|こい|こう|ごう|こず|さず|した|して|しろ|せず|せば|せよ|せる|そう|たい|たず|たら|たり|った|って|てば|てる|とう|ない|なず|ねば|ねる|のう|ばず|べば|べる|ぼう|ます|まず|めば|める|もう|よう|らず|れば|れる|ろう|わず|んだ|んで|くる|する|いる|きる|ぎる|じる|ぜる|ちる|でる|にる|ひる|びる|へる|みる|りる|れた)/, "g");
var verbTaFormRegex2 = new RegExp(/([\u4e00-\u9faf\u3400-\u4dbf])([\u3040-\u309f]|)(た|だ)(?!ち)/, "g"); // past tense verbs 2
var zuFormRegex1 = new RegExp(/([\u4e00-\u9faf\u3400-\u4dbf])(ず)/, "g"); // Kanji unicode+ず
var zuFormRegex2 = new RegExp(/(わ|ら|れ|な|ま|ば|か|さ|け|げ|べ|ぬ|せ)(ず)/, "g"); // verb stems+ず
var kanjiAndKanjiRegex = new RegExp(/([\u4e00-\u9faf\u3400-\u4dbf])(と|や|い)([\u4e00-\u9faf\u3400-\u4dbf])/, "g"); // Kanji unicode+と/や+Kanji
var prtKanjiRegex = new RegExp(/(は|が|に|を|の|な|と|や|も|へ|で|よ|ね|ない)([\u4e00-\u9faf\u3400-\u4dbf])/, "g"); // Particles+Kanji
var kanjiVerbKanjiRegex = new RegExp(/([\u4e00-\u9faf\u3400-\u4dbf])(く|も|じ)([\u4e00-\u9faf\u3400-\u4dbf])/, "g"); // Kanji unicode+く+Kanji
var naNoGaAdverbsRegex = new RegExp(/([\u4e00-\u9faf\u3400-\u4dbf])(?:な|の|が)(?!っ|る)/, "g"); // Kanji unicode+な/の/が
var otherRegex = new RegExp(/(から|まで|でも|ても)/, "g");
var placeNames = new RegExp(/(エサオマントッタベツ|カムイエクウチカウシ|ニセイカウシュッペ|クンネウエンシリ|ハッタオマナイ|オンアネノボリ|ベヨネース列|ほとけのざ海|いちき串木野|イドンナップ|かすみがうら|西クマネシリ|つくばみらい|ウペペサンケ|ヤオロマップ|ベルタルベ|第５鹿島海|第１鹿島海|第１紀南海|第２鹿島海|第２紀南海|第４鹿島海|富士河口湖|八郎潟調整|ハッチャス|ひたちなか|ききょう海|駒橋第２海|駒橋第３海|くじゅう連|クッチャロ|明洋第２海|明洋第３海|南アルプス|ポロヌプリ|ラッキベツ|凌風第２海|山陽小野田|諏訪之瀬水|拓洋第５海|拓洋第１海|拓洋第２海|拓洋第３海|拓洋第４海|トムラウシ|ウエンシリ|安達太良|会津朝日|会津坂下|会津美里|会津若松|安芸太田|あきる野|安芸高田|あさぎり|安渡移矢|別寒辺牛|豊後大野|豊後高田|千早赤阪|ふじみ野|富士吉田|五所川原|日高幌別|東かがわ|東久留米|東みよし|常陸大宮|常陸太田|宝達志水|ホロホロ|市川三郷|伊良湖水|伊豆の国|神石高原|十三本木|加計呂麻|上阿値賀|上富良野|上小阿仁|鹿島槍ヶ|かつらぎ|河内長野|慶良間列|ケラムイ|吉備中央|北日吉海|北高鵬海|北見幌別|北見大和|北名古屋|甲武信ヶ|口永良部|口之島水|九十九里|久万高原|パラオ海|まんのう|みなかみ|南あわじ|南富良野|南日吉海|南高鵬海|南さつま|美濃加茂|三俣蓮華|武蔵村山|那智勝浦|中富良野|中之島水|仲ノ御神|那須烏山|那須塩原|ニペソツ|西海徳海|西御荷鉾|西七島海|西彼杵半|西大和海|野口五郎|仰烏帽子|野沢温泉|大網白里|大台ヶ原|小笠原群|小笠原諸|おいらせ|沖大東海|沖永良部|隠岐の島|近江八幡|オロフレ|大阪狭山|大崎上島|音威子府|ペテガリ|ピリガイ|ピッシリ|ピヤシリ|ポロノツ|陸前高田|利尻富士|佐田岬半|さいたま|佐那河内|サロベツ|佐呂間別|薩摩川内|硫黄島海|四国中央|新ひだか|新上五島|新十津川|後志利別|酒呑童子|周防大島|吐噶喇列|ときがわ|友ヶ島水|土佐清水|宇治田原|宇津ノ谷|八重山列|大和郡山|大和高田|吉野ヶ里|由利本荘|我孫子|阿武隈|阿賀野|阿久比|奥入瀬|鰺ケ沢|赤井川|秋勇留|阿久根|天草諸|奄美諸|安永海|青ケ島|アポイ|有田川|朝熊ヶ|浅間隠|浅瀬石|厚沢部|明日香|阿登佐|渥美半|あわら|粟島浦|的山大|安曇野|米寿海|備讃諸|望星海|房総半|武奈ヶ|豊後水|知夫里|父島列|茅ヶ崎|チキウ|筑紫野|秩父別|知林ヶ|知多半|千代田|朝陽海|中禅寺|大菩薩|大無間|大日ヶ|大千軒|大聖寺|大天井|大東海|男女群|太宰府|島後水|土曜海|海老名|えびの|烏帽子|永平寺|えりも|襟裳海|江田島|藤井寺|富士川|富士見|富士宮|福知山|福徳海|風不死|富良野|芸予諸|元禄海|月曜海|宜野湾|宜野座|五城目|五ヶ瀬|護摩壇|御殿場|五島列|御在所|羽曳野|歯舞諸|八幡平|八王子|八郎潟|南風原|母島海|母島列|八甲田|白鳳海|白露海|浜頓別|半沢海|針ノ木|波佐見|波照間|鳩ケ谷|廿日市|早池峰|平安名|日高川|日吉津|東吾妻|東秩父|東広島|東伊豆|東出雲|東神楽|東串良|東松島|東松山|東村山|東成瀬|東近江|東大阪|東白川|東彼杵|東太郎|東床尾|東大和|東与賀|東吉野|日の出|檜枝岐|日之影|日ノ御|平久保|一ツ瀬|宝永海|鳳来寺|幌加内|防予諸|甫与志|百里ヶ|須賀ノ|揖斐川|一菱内|一ノ目|家島諸|五十嵐|伊平屋|池木屋|壱岐水|幾春別|伊万里|いなべ|猪名川|田舎館|藺灘波|猪苗代|硫黄鳥|伊良部|伊良湖|伊勢原|伊勢崎|一切経|いすみ|五十鈴|糸魚川|磐城海|いわき|岩見沢|伊是名|伊豆半|伊豆諸|泉大津|泉佐野|出雲崎|甚目寺|常願寺|嘉手納|鹿児島|かほく|海形海|海徳海|海洋海|加治木|各務原|加古川|鹿久居|鎌ケ谷|亀田半|上天草|上蒲刈|上北山|上三川|上ノ国|上ノ根|上士幌|上砂川|上富田|上屋久|上湧別|蒲生田|神恵内|神奈川|金田ノ|金ケ崎|神野瀬|香ノ木|観音寺|咸臨海|軽井沢|火星海|春日井|春日部|片山海|香取海|川根本|風間浦|火山列|硫黄列|一明海|嶮暮帰|袈裟丸|気仙沼|紀伊半|紀伊水|木島平|木古内|きく海|紀美野|喜茂別|紀の川|木之本|鬼怒沼|木更津|喜志鹿|岸和田|木曽岬|北相木|北秋田|北大東|北広島|北茨城|北硫黄|喜多方|北川辺|北九州|北中城|北隠岐|北塩原|北大和|喜登牛|屹兎屋|木津川|小臥蛇|小金井|児島半|国分寺|国師ヶ|駒ヶ根|駒橋海|小松島|コムケ|金剛堂|恒星海|古志岐|甑島列|小清水|膠州海|古丹別|古座川|小坂井|神津島|久保田|九度山|久慈平|久米島|久米南|久御山|国後水|国東半|訓子府|黒松内|倶留尊|久留米|狗留孫|草垣群|屈斜路|倶知安|倶多楽|九頭竜|京田辺|京丹波|京丹後|牧之原|真室川|万之瀬|まつ海|松原海|松前半|雌阿寒|明洋海|みどり|未丈ガ|御神楽|神子元|御蔵島|みなべ|南相木|南会津|南足柄|南阿蘇|南房総|南知多|南大東|南越前|南硫黄|南伊勢|南伊豆|南箕輪|南小国|南大隅|南三陸|南島原|南相馬|南種子|南魚沼|南山城|三ツ峠|三浦半|みやき|みやこ|宮古列|宮古島|みやま|宮之浦|宮崎ノ|御代田|水ノ子|藻興部|毛呂山|妹背牛|本白根|茂津多|茂世路|無意根|むかわ|聟島列|武蔵野|明神ヶ|明星海|長久手|長野原|長岡京|南木曽|名古屋|奈半利|奈井江|那珂川|中之条|中能登|中札内|中標津|中種子|中頓別|中土佐|中津川|中津峰|今帰仁|七北田|七時雨|南方諸|南西諸|奈良井|習志野|ナヨカ|根室半|寝屋川|日本平|二本松|新居浜|にかほ|日光海|二王子|ニセコ|西会津|西粟倉|西浅井|西吾妻|西単冠|西伊豆|西米良|西目屋|西之表|西ノ島|西興部|西東京|西和賀|仁淀川|能郷白|野辺地|野々市|納沙布|野迫川|野寒布|能登半|野斗路|野付水|貫気別|雄阿寒|伯母子|尾花沢|小平蕊|小布施|小田萌|小田原|大戸瀬|大江高|大船渡|男鹿半|小鹿野|小笠原|小川原|大河原|大宜味|御鼻部|おおい|大井川|大石田|小値賀|小千谷|隠岐海|隠岐諸|沖大東|沖縄諸|沖ノ鳥|奥出雲|奥三界|奥尻海|奥多摩|御前崎|小美玉|於茂登|大牟田|遠音別|大野原|大野城|大崎ヶ|大崎上|大崎下|長万部|牡鹿半|渡島半|恐羅漢|大隅半|大隅諸|大多喜|大滝根|大田原|乙知志|大利根|尾張旭|小矢部|大山崎|大矢野|大万木|パイミ|パンケ|本ಢ登|礼文水|礼文華|利尻水|立冬海|六ヶ所|ルルイ|留寿都|留夜別|凌風海|龍ケ崎|琉球諸|流星海|佐武流|佐渡海|寒河江|相模原|嵯峨ノ|堺ノ神|先島諸|佐久穂|さくら|三本槍|山上ヶ|三福海|さぬき|佐呂間|サロマ|猿ヶ石|佐世保|さつま|薩摩半|薩南諸|清内路|関ケ原|仙丈ヶ|尖閣諸|セリイ|せたな|瀬戸内|釈迦ヶ|積丹半|斜古丹|新発田|志布志|七ケ浜|七ケ宿|七里長|四條畷|四十曲|四季咲|色丹水|志摩半|島原半|島根半|四万十|下北半|下北山|下仁田|下諏訪|新温泉|新星海|新篠津|信州新|知床半|後志海|酒々井|塩飽諸|小豆島|暑寒別|初山別|昭和新|昭洋海|朱鞠内|蕎麦粒|袖ケ浦|外ヶ浜|曽津高|水曜海|須賀川|須美寿|すさみ|諏訪瀬|丹波山|田布施|大刀洗|多度津|多賀城|多治見|高千穂|任弘海|高井神|高縄半|高根沢|鷹ノ巣|高清水|鷹寿海|田名部|丹後半|田野畑|多良木|多楽水|多良間|たつの|田原本|天仁屋|天保海|弟子屈|栃ノ木|十日町|渡嘉敷|徳之島|徳志別|苫小牧|トマム|豊見城|渡名喜|富田林|鳥ヶ首|十津川|戸蔦別|十和田|洞爺湖|津軽半|つがる|つくば|津久見|津奈木|鶴ヶ島|つるぎ|津和野|鵜渡根|上野原|宇治群|宇治向|うきは|宇那利|鵜の尾|雲辺寺|浦賀水|うるま|得茂別|歌志内|宇多津|宇土半|宇都宮|宇和島|和歌山|輪之内|鷲ヶ巣|渡良瀬|矢部海|八重干|八千代|八重瀬|八方ヶ|山中湖|山ノ内|大和海|八百津|八幡浜|四日市|横芝光|横須賀|与那原|与那国|与那覇|与謝野|吉野川|四街道|湯河原|遊楽部|湯梨浜|ユルリ|湯湾海|諭鶴羽|座間味|銭洲海|善通寺|未丈ヶ|肥前鳥|奄美群|歯舞群|中御神|みよし|南九州|屋久島|網走|安倍|安平|安房|阿武|阿智|足立|安曇|阿賀|吾妻|上松|上尾|粟国|愛別|愛知|愛川|愛南|相ノ|相生|姶良|愛西|相坂|愛荘|藍住|網地|阿嘉|赤平|赤城|赤石|赤磐|阿寒|明石|安芸|秋葉|昭島|秋田|安家|厚岸|赤穂|悪石|海士|尼崎|雨ヶ|天城|雨乞|雨飾|天草|雨巻|奄美|天ノ|阿見|天降|穴水|阿南|安堵|阿仁|安城|安中|安八|青ヶ|青木|青森|青苗|青野|青麻|厚別|荒船|新城|新居|荒海|荒川|荒木|荒雄|荒尾|荒沢|荒島|有田|有福|厚狭|阿佐|朝来|朝日|旭川|朝霞|浅川|浅口|朝倉|浅草|浅間|芦別|芦田|足利|芦北|芦ノ|愛鷹|芦屋|足摺|足寄|阿蘇|足羽|愛宕|熱海|当間|阿東|厚木|厚真|阿波|鮑荒|粟ヶ|淡路|綾部|綾川|綾瀬|莇ヶ|安土|四阿|磐梯|坂東|番匠|弁慶|別府|別子|別海|美唄|美瑛|美深|美幌|備後|平取|枇榔|美良|備瀬|琵琶|備前|坊ノ|武甲|舞台|豊前|ᒑ風|爺爺|茶路|北谷|茶臼|千葉|知夫|秩父|筑後|筑北|築上|千曲|千種|筑西|筑前|知名|茅野|知覧|散布|知立|知多|千歳|智頭|調布|鳥海|長南|長生|銚子|忠別|中央|忠類|大子|大黒|大日|大王|大山|大川|大仙|大東|大谷|段戸|段ヶ|達磨|伊達|デン|堂平|堂ヶ|道後|土器|道志|銅山|江合|江別|乳頭|越前|江戸|愛媛|頴娃|江迎|恵那|遠別|遠軽|恵庭|可愛|江ノ|江の|遠州|江良|襟裳|恵山|江差|枝幸|択捉|府中|普代|笛吹|富士|藤枝|藤岡|藤崎|藤里|藤沢|深川|深浦|深谷|吹上|福智|福江|福井|福岡|袋井|福崎|福島|福津|福山|船橋|舟形|船形|舟橋|風蓮|古平|古殿|椹野|扶桑|福生|双葉|二神|両子|二子|蓋井|二ツ|富津|臥蛇|餓鬼|蒲郡|芸西|玄海|玄界|下呂|岐阜|岐南|御坊|神戸|興居|五條|五霞|権現|五戸|五竜|御所|五泉|五島|江津|五葉|郡上|群馬|行田|玉東|羽幌|鉢伏|八丈|八幡|鉢盛|八戸|八郎|秦野|波戸|芳賀|波勝|博士|発荷|八海|八剣|八高|函館|箱根|白馬|羽咋|白山|伯太|白雲|浜田|浜松|浜名|浜中|羽村|花巻|花咲|鼻高|半田|万年|阪南|飯能|羽生|八峰|八風|播磨|春日|榛名|春野|階上|種市|羽島|橋本|蓮田|波田|波渡|鳩間|鳩山|早出|速日|早川|葉山|早坂|早島|幡豆|辺戸|舳倉|平群|閉伊|平郡|平家|碧南|部子|艫作|檜原|日振|七宗|飛驒|日高|比叡|東水|東通|東川|東根|東浦|斐伊|日出|斐川|氷川|日置|英彦|彦根|姫路|姫神|姫島|氷見|日野|平戸|平ガ|平泉|枚方|平川|平内|平根|平生|平田|平塚|平谷|広川|洋野|広野|広尾|弘前|広瀬|広島|広田|広渡|蛭ヶ|久賀|久之|久山|菱田|菱刈|日田|日立|単冠|人吉|火打|燧ヶ|宝達|防府|伯耆|北海|鉾田|北栄|保倉|北竜|北斗|北杜|帆前|本別|本庄|鳳凰|蓬萊|堀株|幌向|幌内|幌延|星野|細尾|穂高|武尊|兵戸|兵庫|氷ノ|日向|井原|茨城|茨木|揖斐|揖保|伊吹|指宿|市房|市原|市貝|市川|一戸|一宮|一関|井手|伊江|伊賀|飯田|飯豊|飯士|飯島|飯森|飯南|飯梨|飯野|飯舘|飯山|飯塚|飯綱|飯縄|斑鳩|伊方|井川|池田|池間|壱岐|生月|生駒|生口|生地|生坂|今治|今別|今金|今ノ|射水|伊南|伊奈|伊那|稲城|稲穂|稲美|印南|稲庭|稲敷|稲沢|印旛|伊根|いの|井ノ|犬吠|犬山|印西|硫黄|医王|西表|入砂|石廊|海豚|入間|諫早|胆沢|伊勢|伊仙|石垣|石井|石狩|石川|石巻|石岡|石鎚|一色|夷隅|潮来|板倉|伊丹|板野|板柳|以東|伊東|糸田|糸満|五木|岩部|岩出|岩舟|磐井|岩泉|岩木|岩国|岩倉|岩美|岩内|岩沼|岩菅|磐田|岩手|祖谷|伊予|伊豆|出水|和泉|泉崎|出雲|十国|十石|陣馬|甚吉|神通|地芳|地蔵|上越|城ヶ|城峰|城南|常念|常総|城陽|十三|加波|門川|門倉|門真|加賀|鏡石|鏡野|香川|篭坂|河北|甲斐|海部|開聞|海南|開成|海田|海陽|海津|貝塚|加治|鰍沢|加唐|掛川|加古|角田|嘉麻|蒲戸|釜臥|釜石|鎌倉|釜無|瓶ヶ|亀岡|亀山|香美|加美|上郡|神林|上市|上板|上島|上勝|上川|神河|神川|上甑|上峰|上関|上ノ|上山|上里|神栖|神山|加茂|鴨川|蒲生|神威|冠着|姨捨|神室|金見|河南|鹿嵐|金沢|金津|苅田|神田|金川|金山|可児|蟹江|上牧|神流|函南|観音|狩野|鹿野|鹿屋|寒風|甘楽|鹿沼|神埼|韓国|唐松|唐津|狩場|狩勝|雁坂|刈羽|刈谷|軽米|加佐|笠戸|笠ヶ|笠置|加西|笠間|笠松|笠岡|笠利|笠取|嘉瀬|香芝|橿原|嘉島|鹿島|鹿嶋|樫野|柏原|柏崎|迦葉|霞ヶ|粕屋|潟上|交野|片品|加東|香取|葛城|葛尾|勝連|勝浦|勝山|川場|川辺|河内|川越|河口|川口|河合|川井|川島|川上|川北|川俣|川南|川本|川根|川西|香春|川崎|川尻|川副|川棚|川内|河津|茅ヶ|加須|鹿角|桂川|毛勝|毛無|剣淵|気仙|気田|木戸|紀宝|紀北|鬼北|木城|喜界|菊池|菊川|菊陽|紀見|君津|肝付|肝属|金武|金華|錦江|紀ノ|木野|金峰|金北|金時|鬼怒|吉良|霧島|桐生|騎西|木曽|木祖|北方|北川|北木|北郷|北島|北上|北見|北本|北之|北山|杵築|基山|清川|清里|清瀬|清須|清澄|清武|清津|木津|小林|高知|小平|小宝|小泊|声問|江府|甲府|古河|古賀|上毛|高後|小浜|湖北|江北|小糸|甲賀|小貝|九重|狛江|駒ヶ|小牧|小松|古見|菰野|小諸|江南|香南|湖南|昆布|金剛|鴻巣|金精|桑折|甲良|郡山|広陵|甲佐|湖西|小坂|高社|合志|越谷|庚申|甲州|小菅|幸田|小竹|厚東|香東|琴引|琴平|象頭|琴浦|高越|小海|高野|木屋|湖山|高山|子吉|古座|神崎|神津|久場|口ノ|口之|久高|下松|工石|久慈|久住|久喜|九木|球磨|熊谷|熊本|熊野|熊取|久米|久美|雲早|雲取|雲出|国後|六合|国頭|国見|国東|国立|国富|久能|九戸|倉橋|鞍馬|倉敷|鞍手|倉吉|久里|栗原|栗橋|栗子|栗駒|来間|栗山|黒部|黒木|黒姫|黒石|黒髪|黒森|黒瀬|黒潮|黒滝|草垣|草津|櫛田|櫛ヶ|櫛形|串間|串本|釧路|玖珠|久多|沓形|桑名|葛巻|経ヶ|京極|鋸南|京都|共和|経読|久六|九州|馬淵|町田|馬渡|斑尾|前原|前橋|馬毛|真昼|米原|舞鶴|真狩|幕別|枕木|枕崎|真鶴|真庭|真野|丸亀|丸森|円山|松前|増毛|益城|益子|摩周|益田|増穂|松原|松伏|松田|松戸|松江|松川|松本|松野|松阪|松茂|松島|松浦|松山|松崎|摩耶|馬瀬|女木|明和|明洋|芽室|三峰|壬生|三重|御船|御浜|美浜|三原|三春|美浦|美保|三笠|三川|三河|三木|三国|御蔵|美馬|美作|三股|三室|水俣|美波|南牧|南鳥|皆野|皆瀬|美祢|水納|美濃|身延|箕面|箕輪|三面|三坂|御坂|美咲|三朝|美郷|美里|三郷|三沢|三島|三鷹|御嵩|三種|美東|御津|三頭|水戸|三豊|御杖|見附|三ツ|美津|三浦|美和|宮田|宮城|三宅|宮古|都城|宮代|宮塚|宮若|宮崎|宮津|三好|三芳|三次|瑞牆|瑞穂|水上|水巻|瑞浪|茂原|藻鼈|最上|藻岩|設計|藻琴|紋別|物部|物見|真岡|守口|盛岡|守谷|守山|森吉|諸塚|茂木|元荒|本部|本宮|本埜|本栖|本巣|元浦|本山|本吉|牟岐|麦草|無加|武庫|向日|宗像|村上|村田|村山|武利|室根|室蘭|室戸|室津|武蔵|むつ|陸奥|睦沢|妙義|明神|妙見|妙高|名張|鍋倉|那智|苗場|長浜|長井|長泉|長野|長沼|長尾|長岡|長良|長柄|流山|長崎|長島|長洲|永田|長手|長門|長瀞|長和|長与|奈義|那岐|名護|和水|那覇|内保|那賀|那珂|中泊|中通|中川|中城|中井|中島|中条|中甑|中間|中野|中ノ|中之|中津|中山|行方|滑川|浪江|七飯|七尾|七ツ|南部|南郷|南城|南関|南国|難波|南幌|男体|南丹|南砺|南陽|直島|奈良|楢葉|成田|成羽|奈留|鳴沢|鳴瀬|鳴門|成生|那須|名取|夏泊|夏井|名寄|根羽|根子|根室|日南|新田|新潟|新島|新冠|新見|新座|二丈|仁木|日光|人形|二戸|二宮|韮崎|西水|西別|西郷|西原|西方|西桂|西川|西宮|西ノ|西之|西尾|西脇|日進|日勝|仁淀|野原|延岡|登別|野田|直方|野木|野島|野尻|野間|能美|野母|野麦|野根|乗鞍|野呂|能勢|能代|能登|農鳥|能取|野付|野崎|糠平|沼田|沼津|布部|怒和|女峰|入道|入笠|入善|大洗|尾花|帯広|小櫃|大府|越知|大地|落石|大田|大台|大平|大岳|大館|大江|雄冬|男鹿|大垣|大潟|小川|大毛|男木|小城|扇ノ|小郡|越生|大口|小国|御座|小栗|大治|大蟇|大衡|大井|大磯|大分|大泉|笈ヶ|王寺|岡部|岡垣|岡谷|岡山|岡崎|桶川|置戸|隠岐|大木|沖縄|沖ノ|興津|興部|大崩|大熊|大蔵|大倉|奥尻|大桑|大間|大町|御前|小丸|青梅|麻績|青海|大峰|雄物|大森|面白|小本|雄武|大村|大室|女川|小名|邑南|恩馳|音別|遠賀|魚貫|御宿|恩納|温根|大野|小野|尾道|御嶽|邑楽|折爪|小呂|大佐|大阪|大崎|長流|大郷|大瀬|大鹿|大島|忍野|奥州|大須|尾鈴|太田|大竹|王滝|大玉|小谷|小樽|大立|大任|大塔|乙部|音更|音羽|大豊|大津|大槌|大月|御月|大築|大鰐|尾鷲|小山|大淀|小瀬|大空|大洲|大尽|賓根|比布|幌尻|雷電|楽古|蘭越|嵐山|羅臼|礼文|苓北|歴舟|利府|陸別|利尻|栗東|六甲|六戸|留別|留萌|両神|綾里|両津|霊仙|竜ヶ|龍ヶ|竜王|竜爪|佐波|鯖江|鯖石|佐田|佐渡|佐賀|相模|相良|佐幌|佐井|西城|西条|西海|佐伯|埼玉|西都|坂戸|坂祝|坂井|坂出|境港|坂城|坂ノ|酒田|佐川|酒匂|鮭川|佐喜|佐久|佐倉|桜川|桜井|様似|鮫川|寒川|猿投|三瓶|三田|三条|山武|三戸|佐野|山北|札幌|更別|沙流|猿払|猿山|笹ヶ|笹子|篠栗|笹谷|篠山|指臼|佐多|里庄|札内|幸手|沢崎|狭山|佐用|佐々|脊振|精華|聖籠|西予|石動|石北|関川|関山|仙北|千代|仙台|泉南|釧北|船通|世羅|セリ|瀬戸|雪裡|摂津|積丹|紗那|斜里|芝川|柴田|芝山|標茶|蕊取|蘂取|標津|士別|紫尾|志発|渋川|渋海|至仏|七面|七戸|七島|滋賀|重信|士幌|椎葉|志賀|鹿部|色麻|鹿町|鹿追|然別|志木|式根|色丹|支笏|志摩|島原|島田|島牧|島本|島根|島浦|島山|志免|清水|下田|下郷|下市|下地|下條|下川|下甑|下関|下ノ|下野|下妻|占冠|信濃|新保|新地|新郷|新宮|宍道|新庄|榛東|新得|新富|塩竈|塩尻|汐首|塩見|塩谷|塩屋|七宝|白髪|白浜|白旗|白猪|白岩|白神|白川|白河|白子|白根|白糠|白老|白岡|白砂|白鷹|知床|尻別|尻羽|知内|尻屋|白井|白石|白木|城里|四阪|獅子|宍粟|設楽|紫波|雫石|静間|静内|静岡|庄原|菖蒲|小豆|庄内|勝央|庶路|昭和|朱太|秋芳|周南|春別|俊鷹|壮瞥|祖母|添田|孀婦|総社|草加|相馬|曽爾|曽於|空知|匝瑳|宗谷|須恵|周布|杉戸|須郷|水晶|吹田|宿毛|住田|守門|洲本|砂川|周防|駿河|須崎|裾花|裾野|寿都|諏訪|須坂|珠洲|鈴鹿|束稲|立花|立川|立丸|只見|忠岡|多賀|田上|田川|田原|太平|太地|大観|大紀|大樹|太鼓|胎内|大船|大雪|太子|大正|太東|大和|田尻|多可|高滝|喬木|高萩|高浜|高原|高梁|高畠|鷹架|高石|高隈|高松|高見|高森|高鍋|高縄|鷹巣|高尾|高岡|宝塚|高砂|高崎|高瀬|高島|鷹栖|高鈴|高取|鷹取|高津|高月|高槻|高妻|竹原|竹野|武雄|武石|竹田|竹富|武豊|多気|滝川|滝上|滝沢|田子|多古|多久|多摩|玉川|玉城|玉置|玉村|玉名|玉野|田村|田辺|棚倉|丹波|種子|谷川|田野|丹沢|龍飛|太良|多良|多楽|太郎|垂井|樽前|垂水|田代|館林|立石|立科|蓼科|立山|館山|龍郷|竜舞|辰野|田沢|手取|手稲|天童|天栄|天狗|天神|天川|天理|天竜|天龍|天塩|天売|鳥羽|砥部|当別|飛島|湯沸|栃木|戸田|海驢|魹ヶ|東栄|東沸|涛沸|戸隠|東金|時津|東郷|東峰|東北|当幌|都井|東員|十勝|東海|土岐|常滑|常浪|常呂|所沢|床丹|徳之|戸倉|徳島|東京|当麻|苫前|登米|東御|富合|富加|富岡|富里|富谷|砺波|頓別|富田|利根|遠野|土庄|東庄|東温|虎姫|取手|鳥居|鳥甲|鷲子|塘路|土佐|戸崎|答志|利別|十島|利島|遠島|鳥栖|十津|鳥取|洞爺|富山|東洋|豊明|豊橋|豊平|豊川|豊頃|豊中|豊根|豊似|豊能|豊丘|豊岡|豊郷|豊田|豊富|豊浦|豊山|戸沢|津幡|津別|土浦|都賀|津堅|月形|筑波|津倉|嬬恋|爪木|津南|常神|津野|都農|釣掛|都留|敦賀|鶴居|鶴見|鶴御|鶴岡|鶴田|対馬|津島|津山|津崎|宇部|産山|内子|内灘|内浦|噴火|内山|宇陀|上田|植木|上野|有家|羽後|鵜来|宇治|請戸|宇検|宇城|宇久|馬路|宇美|海別|雲南|雲仙|魚野|魚沼|魚釣|魚津|浦幌|浦河|浦添|浦臼|浦安|嬉野|売木|雨竜|宇佐|牛久|牛廻|有珠|碓氷|臼杵|宇土|空木|和田|和泊|和賀|涌蓋|輪島|若松|若宮|若狭|若桜|和気|和木|稚内|和光|涌谷|鰐塚|鷲ヶ|鷲宮|和寒|度会|亘理|和束|矢部|養父|矢吹|八街|八重|焼尻|矢巾|矢作|矢筈|弥彦|矢板|焼津|矢掛|焼石|駅館|屋久|八雲|薬師|山田|山江|山鹿|山形|山県|山口|山国|山元|山中|山梨|山辺|山都|矢祭|山添|八女|八溝|柳川|柳井|柳津|止別|八尾|槍ヶ|鑓ヶ|八潮|屋代|野洲|安田|安来|安満|泰阜|矢立|弥富|八ヶ|八代|八頭|余別|余呉|余市|横当|横浜|横手|横津|横瀬|読谷|蓬田|米子|米代|米沢|寄居|養老|与路|与論|吉田|吉井|吉賀|吉川|吉見|吉野|吉岡|吉富|羊蹄|湯浅|夕張|湧別|湧洞|湯殿|由布|勇払|湯川|由比|結城|行橋|由仁|湯前|由良|見市|由利|勇留|檮原|梼原|湧水|湯湾|湯山|遊佐|湯沢|座間|蔵王|笊ヶ|逗子|飛騨|紀の|糸島|伊佐|相島|相川|網代|赤岳|赤泊|赤川|赤村|赤島|明浜|秋川|姉島|兄島|青島|荒崎|有馬|旭岳|旭市|浅虫|芦辺|阿戸|粟島|芦原|粟津|綾町|梓川|別山|別所|別飛|坊中|父島|長府|駄知|大安|島後|土居|島前|恵曇|藤原|深島|布野|古岳|伏見|月山|銀座|郷崎|兀岳|萩市|母島|早岐|弾崎|函岳|塙町|原村|迫川|柱島|走島|畑野|初島|涸沼|日山|火崎|響灘|東島|東村|東山|肱川|聖岳|光市|姫川|姫崎|姫戸|丁岳|平島|平瀬|平野|蒜山|人首|燧灘|箒川|北勢|本島|細島|保田|伊島|市崎|飯坂|池島|池袋|今川|妹島|印賀|西崎|石田|斎灘|厳島|宮島|祝島|岩瀬|出島|常磐|上下|椛島|樺島|川平|角山|梯川|神島|上県|神岡|鷗島|叶崎|鐘崎|冠島|冠山|烏川|狩俣|柏市|加太|傾山|勝本|河地|川湯|芥屋|君田|吉舎|北岳|北浦|甲田|小串|児島|小島|甲奴|弥山|倉岳|位山|倉石|呉市|呉羽|黒崎|黒島|車山|京町|前岳|前島|孫島|米谷|丸山|松代|女島|姪島|見島|緑川|耳川|南島|三崎|岬町|三石|宮川|水橋|門司|森町|師崎|鵡川|向原|向島|聟島|室積|名石|中岳|中海|媒島|猫崎|新穂|西島|錦川|錦町|西山|鋸山|野村|沼島|沼川|尾崎|男島|雄島|御岳|尾岳|御山|雄山|小木|扇山|大越|大原|沖島|大湊|大岬|思川|鬼首|大沼|黄島|恐山|弟島|霊山|犀川|坂町|栄町|栄村|境町|堺市|作木|三嶺|三和|棹崎|笹山|関市|関崎|仙崎|渋峠|渋谷|下島|篠島|潮岬|城川|白瀬|庄川|祖納|須川|菅島|菅平|須磨|洲崎|摺沢|橘湾|鷹島|高岳|高宮|宝島|竹島|武山|蛸島|度島|玉島|樽見|手島|豊島|光岳|天山|寺島|戸島|土肥|戸出|泊村|泊山|鳥崎|鳥島|豊玉|津市|燕岳|燕市|築島|角島|剱岳|剣山|剱崎|鶴崎|津田|豆酘|堤川|植田|請島|鬱岳|内海|和倉|蕨市|渡波|焼岳|焼山|山部|山代|八島|呼坂|淀川|横岳|横島|横川|嫁島|米山|鎧崎|吉和|四倉|湯島|湯本|閖上|遊子|銭洲)(都|道|府|県|市(?!長)|町|村|居住地|山|岳|嶽|峰|森|嶺|峠|岬|崎|埼|鼻|浜|川|用水路|湖|浦|潟|沼|池|外海|灘|湾|海峡|水道|海嶺|海山|海山群|海台|海溝|舟状海盆|海盆|海底谷|堆|平坦面|海裂|長谷|島|岩|瀬|山地|山脈|平野|半島|台地|高原|丘陵|諸島|群島|列島|田|駅|橋|港|線|谷|区)?/, "g");
var countersRegex = new RegExp(/(?:\d)(インディクティオ|フォートナイト|オリンピアード|プランク時間|グレゴリオ年|フェムト秒|スベドベリ|マイクロ秒|モーメント|セメスター|ユリウス年|ヨベルの年|ミレニアム|ヨクト秒|ゼプト秒|シェイク|四半世紀|アト秒|ピコ秒|ナノ秒|ミリ秒|ジフィ|キロ秒|メガ秒|朔望月|四半期|太陽年|恒星年|五年紀|十年紀|ギガ秒|テラ秒|銀河年|宇宙年|年間|時間|平年|閏年|世紀|秒|分間|分|刻|日|週間|週|旬|年|月号|月|時|歳|本|枚|冊|匹|回|個|つ|倍|代|次元|次|名)/, "g");
var otherSuffixRegex = new RegExp(/(殿|氏|さん|君|くん|ちゃん|坊|達|たちも|たち|だち|者団|者|院|率|々)/, "g");
var kanjiOtherSuffixRegex = new RegExp(/([\u4e00-\u9faf\u3400-\u4dbf])(神|用)(?!経)/, "g"); // kanji+... but not ...
var text = "";
async function processComparisonText() {
	segs = [];
	let comparisonTextInput = document.getElementById("comparisonTextInput");
	text = comparisonTextInput.value;
	// REMOVE TERMS THAT MAY CONFUSE THE SEGMENTER
	// Remove English characters
	text = text.replace(alphaRegex, "_");
	text = text.replace(numberRegex, "_$1");
	// Remove newline characters
	text = text.replace(newLineRegex, "_");
	// Remove and separate certain ('unique') terms
	text = text.replace(termsToReplaceRegex, "_");
	text = text.replace(katakanaRegex, "_$1$2_"); // TinySegmenter will usually do this, but sometimes will not for Kata+Hira
	text = text.replace(honKanjiRegex, "_$1");
	text = text.replace(verbRegex, "$1$2$3_");
	text = text.replace(verbTeRegex, "$1_$2");
	text = text.replace(verbKuSaBeforeNRegex, "$1$2$3_");
	text = text.replace(verbAuxRegex, "$1_")
	text = text.replace(verbTeFormRegex, "$1_");
	text = text.replace(verbTaFormRegex2, "$1$2$3_");
	text = text.replace(zuFormRegex1, "$1_$2");
	text = text.replace(zuFormRegex2, "$1_$2");
	text = text.replace(kanjiAndKanjiRegex, "$1$2_$3");
	text = text.replace(prtKanjiRegex, "$1_$2");
	text = text.replace(kanjiVerbKanjiRegex, "$1$2_$3");
	text = text.replace(naNoGaAdverbsRegex, "$1_");
	text = text.replace(otherRegex, "$1_");
	//separate after modifiers
	text = text.replace(otherSuffixRegex, "$1_");
	text = text.replace(kanjiOtherSuffixRegex, "$1$2_");
	text = text.replace(countersRegex, "$1_");
	text = text.replace(placeNames, "{$1$2}");
	// Tokenize text to an array
	segs = segmenter.segment(text);
	// Remove or fix segmentation delimiters
	for (var i = 0; i < segs.length; i++) {
		if (segs[i] === "_") {
			segs[i] = "";
		}
		if (segs[i] === "_{") {
			segs[i] = "{";
		}
		if (segs[i] === "}_") {
			segs[i] = "}";
		}
	}
	// RE-COMBINE incorrectly segmented terms
	for (var i = 0; i < segs.length; i++) {
		if (segs[i] && segs[i+1]) {
			// RE-COMBINE Kanji Names
			if (segs[i] === "{") {
				if (_debug) console.log("RE-COMBINE Kanji Names: " + segs[i+1] +" & " + segs[i+2] + "...");
				// remove the start checkpoint
				segs[i] = "";
				// cache the final checkpoint so as to not re-calculate it
				var greedyCheckpoint = segs.indexOf("}");
				var c_greedyCheckpoint = greedyCheckpoint;

				// Greedily search for and consume all characters until final checkpoint
				for (var x = i; x < c_greedyCheckpoint+1; x++) {
					// Remove final checkpoint and exit
					if (segs[x] === segs[c_greedyCheckpoint]) {
						segs[x] = "";
						break;
					}
					// combine segments
					segs[i] += segs[x];
					// remove consumed characters and go back a step
					if (i !== x) {
						segs.splice(x, 1);
						c_greedyCheckpoint--;
						x--;
					}
				}
			}
			// RE-COMBINE singular Kanji to next largest Kanji compound (上映会と生配信が = ["生配", "信"] = 生配信)
			if (segs[i].length === 1) { // eg. 小+漢字
				if (kanji.test(segs[i]) && kanji.test(segs[i+1]) && !hiragana.test(segs[i+1]) && !katakana.test(segs[i+1])) {
					if (_debug) console.log("RE-COMBINE Kanji 1: " + segs[i] +" & " + segs[i+1]);
					segs[i] += segs[i+1];
					segs.splice(i+1, 1);
				}
			}
			if (segs[i+1].length === 1) { // eg. 漢字+会
				if (kanji.test(segs[i][segs[i].length-1]) && kanji.test(segs[i+1]) && !hiragana.test(segs[i+1]) && !katakana.test(segs[i+1])) {
					if (_debug) console.log("RE-COMBINE Kanji 2: " + segs[i] +" & " + segs[i+1]);
					segs[i] += segs[i+1];
					segs.splice(i+1, 1);
					if (i != 0) i--;
				}
			}
			// RE-COMBINE singular adjectival Kana
			let adjprt = ["い", "さ", "ず", "み", "め"];
			if (segs[i].length > 1 && segs[i+1].length === 1 && adjprt.indexOf(segs[i+1]) > -1) {
				if (hiragana.test(segs[i][segs[i].length-1]) || kanji.test(segs[i][segs[i].length-1])) {
					if (_debug) console.log("RE-COMBINE adjectival Kana: " + segs[i] +" & " + segs[i+1]);
					segs[i] += segs[i+1];
					segs.splice(i+1, 1);
				}
			}
			// RE-COMBINE prefixes
			let prefixes = ["ご", "お"];
			if (segs[i-1] && prefixes.indexOf(segs[i-1]) > -1) {
				if (_debug) console.log("RE-COMBINE Prefixes: " + segs[i] +" & " + segs[i-1]);
				segs[i] = segs[i-1] + segs[i];
				segs.splice(i-1, 1);
			}
			// RE-COMBINE suffixes
			let suffixes = ["殿", "様", "さま", "氏", "さん", "君", "くん", "ちゃん", "坊", "達", "たち", "たちも", "だち", "ら"];
			if (suffixes.indexOf(segs[i+1]) > -1) {
				if (_debug) console.log("RE-COMBINE Suffixes: " + segs[i] +" & " + segs[i+1]);
				segs[i] += segs[i+1];
				segs.splice(i+1, 1);
			}
			// RE-COMBINE auxillaries
			if (kanji.test(segs[i])) {
				if (segs[i+1].startsWith("ら") || segs[i+1] === "がっ") { // eg. 得られる
					if (_debug) console.log("RE-COMBINE Auxillaries 1: " + segs[i] +" & " + segs[i+1]);
					segs[i] += segs[i+1];
					segs.splice(i+1, 1);
				}
			}
			if (segs[i].length > 1 && hiragana.test(segs[i][segs[i].length-1]) && hiragana.test(segs[i+1][0])) {
				let prt = ["は", "が", "に", "を", "の", "な", "と", "や", "も", "へ", "お", "ご", "で", "よ", "ね"];
				if (prt.indexOf(segs[i]) === -1 && prt.indexOf(segs[i+1]) === -1) {
					if (_debug) console.log("RE-COMBINE Auxillaries 2: " + segs[i] +" & " + segs[i+1]);
					segs[i] += segs[i+1];
					segs.splice(i+1, 1);
					if (i != 0) i--;
				}
			}
		}
	}
	// Remove duplicate terms
	segs = uniq_fast(segs);
}

// Most common words (pronouns, verbs, positions), disconnected verb/adjective auxillaries, particles, and counters, quantifiers and numbers
var grammar = ["ては", "では", "ので", "たい", "まま", "もし", "なら", "から", "より", "まで", "だった", "でした", "ほど", "たり", "とも", "かしら", "わけ", "べき", "べく", "しつつ", "つつ", "ます", "おける", "ずつ", "なし", "にて", "なの", "っぽい", "っぽく", "らしい", "らしく", "らしき", "しか", "だけ", "のみ", "にも", "にか", "なのに", "のに", "のかな", "のか", "かな", "かの", "かも", "よね", "なと", "から"];
var terms = ["なに", "なん", "何", "なにか", "なんか", "ない", "した", "いいえ", "いや", "行く", "行き", "こう", "そう", "はい", "こと", "事", "もの", "物", "なく", "なんと", "いつ", "格好いい", "かっこいい", "カッコイイ", "かわいい", "可愛い", "みる", "おすすめ", "オススメ", "おく", "ほう", "まず", "そのほう", "ほら", "水", "際", "さて", "さま", "さん", "くん", "ちゃん", "笑", "心", "ひとつ", "かも", "だわ", "だね", "だよ", "すし", "わが", "今", "いま", "為", "見る", "見ます", "みます", "見ません", "みません", "くる", "来る", "きて", "来て", "きます", "来ます", "きません", "来ません", "うん", "そば", "いく", "まあ", "今回", "今度", "今日", "今年", "ことし", "彼女", "彼", "我", "見せる", "君", "つく", "いう", "方", "例", "いか", "なか", "ふーん", "きもち"];
var auxillaries = ["まして", "ました", "なくて", "なかった", "させる", "られる", "ありませ", "いませ", "たうえ", "とかそういう", "はすぐ", "といて", "そのほか", "なだけ", "・", "もらい", "により", "はいか", "しまい", "ながらこう", "ながらそう", "ものの", "ことの", "わかり", "にかけ", "その後さら", "ときや", "こうし", "なけれ", "はいえ", "がほぼ", "だけど", "のいま", "いいじゃ", "ときも", "なおこれ", "でいき", "いれる", "ままで", "じゃん", "みましょ", "ましょ", "しましょ", "ここから", "わから", "までき", "ならず", "なもの", "それも", "なさい", "そうし", "こうし", "あるけれど", "につい", "たりし", "といって", "おこう", "やその", "できれ", "たりすれ", "やすく", "いたら", "ならば", "すぎて", "がれる", "きませ", "いきませ", "いいくらい", "できず", "できませ", "らじる", "にして", "によれ", "ですけど", "もらえ", "といえば", "しちゃい", "それじゃ", "これじゃ", "たりして", "だりして", "もらっちゃ", "にすれ", "はいませ", "いって", "わかり", "いえる", "はじめ", "たらすぐ", "はいって", "こんにち", "こんばん", "もらって", "いいんじゃ", "たらまた", "したい", "やりたい", "はして", "がして", "いただき", "しゃい", "しませ", "こられ", "そられ", "いられ", "ござい", "しづらい", "ますしね", "ますか", "ません", "ませんか", "なって", "にいき", "てるんで", "てるんだ", "てるん", "されて", "やった", "やって", "やってて", "やってた", "すれば", "てきた", "やれば", "させた", "にきて", "でいた", "でみた", "てみた", "なった", "なかった", "みれば", "かかった", "やろう", "かなと", "ありま", "いりま", "といけ", "もって", "あって", "やまない", "とって", "られる", "やれる", "といった", "ますよね", "なきゃ", "にいろ", "みせる", "たよな", "たよね", "だよな", "だよね", "おいて", "おいた", "かかり", "たかった", "られて", "られた", "なろう", "たって", "みせて", "らえる", "なくても", "いなくて", "られま", "いた方", "もたち", "いました", "がれて", "いきま", "いれば", "かけて", "にかけて", "かけていた", "かかって", "あとに", "しろよ", "られれば", "ていて", "おらず", "なわれ", "があり", "もあり", "たくて", "にいた", "てきま", "がいなく", "なれば", "いった", "てくれ", "うーん", "かって", "ついた", "もほか", "かけた", "らった", "たちの", "てみて", "とおり", "がわかり", "られます", "ながった", "わかって", "ごろから", "ごろな", "して", "してます", "している", "していました", "していない", "していません", "していた", "していて", "してて", "します", "しました", "とみて", "でさえ", "いまから", "ろうなぁ", "ぎませ", "ちませ", "にませ", "びませ", "みませ", "りませ", "いましょ", "きましょ", "ぎましょ", "ちましょ", "にましょ", "りましょ", "いじゃう", "いすぎる", "いちゃう", "いなさい", "きすぎる", "ぎすぎる", "きちゃう", "きなさい", "ぎなさい", "こさせる", "こられる", "しすぎる", "しちゃう", "しなさい", "ちすぎる", "ちなさい", "っちゃう", "にすぎる", "なさい", "にません", "びすぎる", "びなさい", "みすぎる", "みなさい", "りすぎる", "りなさい", "んじゃう", "いそう", "いたい", "いだら", "いたり", "かせる", "がせる", "かない", "かれる", "きそう", "ぎそう", "ぎたい", "きたり", "こない", "こよう", "これる", "しそう", "しよう", "すぎる", "たせる", "たれる", "ちそう", "ちたい", "ちゃう", "なさい", "なせる", "なない", "なれる", "ばせる", "ばれる", "びそう", "びたい", "ませる", "ません", "まない", "まれる", "みそう", "みたい", "らせる", "られる", "りそう", "りたい", "わせる", "われる", "んだら", "んだり", "なられて", "はわかって", "いません", "しして", "であり", "なくして", "もんね", "なりかねない", "いけば", "おけば", "よなあ", "できそう", "なりそう"];
var modifiers = ["一", "二", "三", "四", "伍", "六", "七", "七", "八", "九", "十", "関", "前", "まえ", "次", "後", "あと", "時", "とき", "上", "うえ", "下", "した", "右", "左", "中", "別", "他", "ただ", "だけ", "たち", "たび", "人", "カ月", "用", "向け", "率", "日", "月", "年", "内", "外", "方", "者", "市", "県", "側", "以内", "以上", "以下", "おおよそ", "およそ", "型", "式", "第", "代", "約", "円", "的", "量", "非", "不", "系", "化", "台", "版", "おそらく", "術", "女", "男", "子", "歳", "才", "ごろ", "区", "性", "御", "部", "分", "初", "新", "つ", "杯", "匹", "本", "階", "個", "箇", "个", "ヶ", "枚", "名", "面", "冊", "話", "秒", "月", "泊", "時間", "箇月", "週", "倍", "番", "度", "畳", "場", "倍", "晩", "番", "尾", "文", "秒", "着", "挺", "丁", "町", "代", "段", "段落", "筆", "服", "幅", "振", "学級", "語", "合", "言", "具", "泊", "敗", "箱", "張", "柱", "発", "品", "筆", "歩", "票", "拍子", "字", "児", "錠", "条", "架", "課", "株", "回", "ヶ国", "箇国", "画", "貫", "艦", "系統", "件", "軒", "機", "基", "斤", "戸", "校", "稿", "行", "齣", "コマ", "献", "句", "口", "組", "脚", "客", "曲", "局", "枚", "巻", "幕", "門", "問", "折", "頁", "例", "礼", "輪", "両", "棹", "冊", "席", "隻", "品", "社", "式", "勝", "首", "週", "種", "足", "双", "束", "体", "俵", "滴", "点", "頭", "通", "坪", "粒", "通話", "羽", "把", "話", "夜", "膳", "州", "超", "似", "もう", "全", "小", "大", "ころ", "誌", "師", "地", "症", "頃", "比", "旧", "坂", "税", "再", "底", "月号", "号"];

// Concat the above arrays into groups
var jpStopWords_base = [...grammar, ...terms];
var jpStopWords = [...grammar, ...terms, ...auxillaries, ...modifiers];

// Test for banned terms
var jaTest = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;
var hiragana = /[\u3040-\u309f]/;
var katakana = /[\u30a0-\u30ff]/;
var kana = /[\u3040-\u309f\u30a0-\u30ff]/;
var kanji = /[\u4e00-\u9faf\u3400-\u4dbf]/;
var punctuation = /[\u3000-\u303f]|[\uff00-\uff9f]|[・`~!@#$%^&*()_\-+=\]\[}{';":\/?.>,<]|[\d]/;
var banned = [];
function testBanned(term) {
	let res = false;
	// Test whether a kana term, with first or last character removed, is equal to a term. Removes the need for some hard-coded auxillaries.
	if (term.length >= 3) {
		let pfxRemoved_term = term.substr(1); // term with first character removed
		let sfxRemoved_term = term.slice(0, -1); // term with last character removed
		if (jpStopWords_base.indexOf(pfxRemoved_term) > -1 || jpStopWords_base.indexOf(sfxRemoved_term) > -1) {
			res = true;
		}
	}
	// Test whether a term is banned
	if (!res) {
		let bannedAux = ["っ", "ッ", "ぇ"];
		if (term.length <= 2 && !kanji.test(term) && !katakana.test(term) && hiragana.test(term)
			|| term.length === 1 && katakana.test(term)
			|| jpStopWords.indexOf(term) > -1
			|| !term.includes("々") && punctuation.test(term)
			|| !jaTest.test(term)
			|| bannedAux.indexOf(term[0]) > -1
			|| bannedAux.indexOf(term[term.length-1]) > -1
			|| term.startsWith("ー")
			|| term.length <= 3 && term.endsWith("ー")
			|| term.length === 2 && katakana.test(term) && hiragana.test(term))
		{
			res = true;
		}
	}
	if (res) banned.push(term);
	//if (term.length <= 2 && !kanji.test(term) && !katakana.test(term) && hiragana.test(term)) banned.push(term);
	return res;
}

// Purify terms of unnecessary parts
var puncReg = new RegExp(punctuation, "g");
var alphabetRegex = new RegExp(/[A-Za-z]/, "g");
function purify(term) {
	// cache term, in case it becomes undefined
	let c_term = term;
	// Remove punctuation
	term = term.replace(puncReg, "");
	// Remove English
	term = term.replace(alphabetRegex, "");
	// Remove ending する verbs...
	term.replace(/する|しない|します|しません|される|されない|されます|させる|させない/g, "");
	if (!term) return c_term;
	else return term;
}

// Non-blocking Comparison Setup
var session = 0; // Required to reset results correctly
var total = segs.length; // Matches out of total
var matches = 0; // Matches out of total
var newWords = []; // Record unknown words
var outIndex = 0; // Top comparison loop
var inIndex = 0; // Inside comparison loop
var chunk = 10000; // How many comparisons to do at once, so as to be non-blocking (asynchronous)
var promises = []; // Record comparison chunk as a promise for callback (and so as to prevent result overflow and bleeding?)
function compare() {
	if (!knownWordsArr || knownWordsArr.length <= 0) {
		return window.alert("A List of Known Words is Required!");
	}
	if (!knownWordsArr[1].split(delimiter)[column]) { // Check 1 and not 0, in case of CSV header comment
		return window.alert("Delimiter and/or Column are Incorrect!");
	}
	if (!segs || segs.length <= 0) {
		return window.alert("A Japanese Text is Required!");
	}

	// Reset new words
	let newWordsTextarea1 = document.getElementById("newWordsTextarea1");
	newWordsTextarea1.value = "";
	let newWordsTextarea2 = document.getElementById("newWordsTextarea2");
	newWordsTextarea2.value = "";

	// Setup comparison values, and start comparison
	session++;
	banned = [];
	total = segs.length;
	matches = 0;
	newWords = [];
	outIndex = 0;
	inIndex = 0;
	promises = [];
	outsideComparison(outIndex, inIndex, session);
}

function outsideComparison(outIndex, inIndex) {
	// Display result & new words
	displayResult(matches, total, newWords);

	// Show loading cursor and return if finished
	if (outIndex < segs.length) document.body.style.cursor = "progress";
	else return document.body.style.cursor = "";

	// Reset overflowing inside index for next loop
	inIndex = inIndex || 0;

	// Early out if term is banned
	if (testBanned(segs[outIndex])) {
		total--;
		outIndex++;
		return outsideComparison(outIndex);
	}

	promises = [];
	promises.push(insideComparison(outIndex, inIndex, chunk));
	Promise.race(promises).then(() => {
		if (outIndex < segs.length) {
			outIndex++;
			outsideComparison(outIndex);
		}
	});
}

function insideComparison(outIndex, inIndex, chunk) {
	let c_session = session; // cache the current session
	let c_chunk = chunk; // cache the current chunk size
	return new Promise ((resolve, reject) => {
		setTimeout(() => {
			while (c_chunk-- && inIndex < knownWordsArr.length) {
				// Stop processing if new processing session has started
				if (c_session !== session) return c_chunk = 0;

				// Whether current process should resolve
				let shouldResolve = false;

				// Current known word
				let wordListWord = knownWordsArr[inIndex].split(delimiter)[column];

				// ERROR REDUNDANCY FOR MALFORMED KNOWN WORD FILE ROWS
				// If word cannot be found, go to next word
				// Or, record new word if end of index
				if (!wordListWord && inIndex < knownWordsArr.length-1) {
					inIndex++;
					return outsideComparison(outIndex, inIndex);
				}
				else if (!wordListWord) {
					inIndex++;
					newWords.push(segs[outIndex]);
					return resolve();
				}

				// Clean known word of unneeded data
				wordListWord = purify(wordListWord);

				// Compare until any equal match is found
				let result = fuzzy.match(wordListWord, segs[outIndex]);

				// 1 and 2 Character Compounds must be 100%
				if (segs[outIndex].length <= 2 && result >= 100) {
					if (_debug) console.log("100 Result is: " + result + " from " + wordListWord + " & " + segs[outIndex]);
					matches++;
					shouldResolve = true;
				}
				// Otherwise, be 60% or above
				else if (segs[outIndex].length >= 2 && result >= 60) {
					if (_debug) console.log("60 Result is: " + result + " from " + wordListWord + " & " + segs[outIndex]);
					matches++;
					shouldResolve = true;
				}
				// Record new words
				else if (inIndex >= knownWordsArr.length-1) {
					if (_debug) console.log("new word: " + segs[outIndex]);
					newWords.push(segs[outIndex]);
					shouldResolve = true;
				}

				inIndex++;

				if (shouldResolve) {
					return resolve();
				}

				// next chunk
				if (c_chunk === 0) {
					outsideComparison(outIndex, inIndex);
				}
			}
		}, 1);
	});
}

/* Gradient fade - Source: https://codepen.io/daviscodesbugs/pen/LyPdwy */
function changeColor(i) {
	i = i || 0;
	let colors = ["#f46974", "#ffb766", "#fce971", "#85f27b"]; // red, orange, yellow, green
	let resultDisplay = document.getElementsByClassName("result-display")[0];
	resultDisplay.style.cssText = "background-color: " + colors[i];
}
let newWordsTextStr1 = "";
let newWordsTextStr2 = "";
let newWordLen = -1;
function displayResult(matches, total, newWords) {
	// Display the result form
	let resultDisplay = document.getElementById("resultDisplay");
	resultDisplay.style.display = "block";

	// Display the percentage of matches
	let resultPercentField = document.getElementById("resultPercent");
	let resultPercent = Math.floor(matches / total * 100);
	if (!resultPercent) resultPercent = 0;
	resultPercentField.textContent = resultPercent + "%";
	// Display the raw number of matches
	let resultFractionField = document.getElementById("resultFraction");
	resultFractionField.textContent = matches + " / " + total;

	// Background color waterfall
	if (resultPercent < 25) {
		changeColor(0);
	}
	else if (resultPercent >= 25 && resultPercent < 50) {
		changeColor(1);
	}
	else if (resultPercent >= 50 && resultPercent < 70) {
		changeColor(2);
	}
	else if (resultPercent >= 70) {
		changeColor(3);
	}

	// Get new words form
	let newWordsDisplay = document.getElementById("newWordsDisplay");
	let newWordsHtmlField = document.getElementById("newWordsHtml");
	let newWordsTextarea1 = document.getElementById("newWordsTextarea1");
	let newWordsTextarea2 = document.getElementById("newWordsTextarea2");

	// Reset new words form if there are no new words
	if (!newWords[0]) {
		newWordsDisplay.style.display = "none";
		newWordLen = -1;
		newWordsHtmlField.innerHTML = "";
		newWordsHtmlStr = "";
		newWordsTextarea1.value = "";
		newWordsTextStr1 = "";
		newWordsTextarea2.value = "";
		newWordsTextStr2 = "";
		return;
	}
	// Return if there are no new words to display
	if (newWordLen === newWords.length) return;
	newWordLen = newWords.length;

	// Display the new words form
	newWordsDisplay.style.display = "block";
	// Display new words
	newWordsHtmlStr += " <span class='newWord'>" + newWords[newWords.length-1] + "</span>";
	newWordsHtmlField.innerHTML = newWordsHtmlStr;
	newWordsTextStr1 += newWords[newWords.length-1] + " ";
	newWordsTextarea1.value = newWordsTextStr1;
	newWordsTextStr2 += newWords[newWords.length-1] + "\n";
	newWordsTextarea2.value = newWordsTextStr2;
}
