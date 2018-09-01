/*
	MIT License
	Copyright (c) 2018 Kai Krause <kaikrause95@gmail.com>
	See license here: https://github.com/krausekai/Japanese-Text-Difficulty-Checker/blob/master/LICENSE.txt
*/

var knownWordsArr = [];
function loadKnownWordsList() {
	try {
		var storedKnownWordsArr = JSON.parse(localStorage.getItem("knownWordsArr"));
		if (storedKnownWordsArr && storedKnownWordsArr.length >= 1) {
			knownWordsArr = storedKnownWordsArr;
			var isFileSavedField = document.getElementById("isFileSaved");
			isFileSavedField.textContent = "Known Words Have Been Loaded From Last Session";
		}
	} catch (e) {
		console.error(e);
	}
}
// TODO: Option to optimize word list and LocalStorage limitation by only storing the delimited column
function saveKnownWordsList() {
	if (knownWordsArr && knownWordsArr.length >= 1) {
		localStorage.setItem("knownWordsArr", JSON.stringify(knownWordsArr));
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
async function processComparisonText() {
	return new Promise((resolve, reject) => {
		var comparisonTextInput = document.getElementById("comparisonTextInput");
		var text = comparisonTextInput.value;
		// Remove English characters from text, since it may cause segmentation issues
		text = text.replace(/[A-Za-z]/g, "");
		// Tokenize text to an array
		segs = segmenter.segment(text);
		// Remove duplicate terms
		segs = uniq_fast(segs);
		resolve();
	});
}

var delimiter = "";
function loadDelimiter() {
	var storedDelimiter = JSON.parse(localStorage.getItem("delimiter"));
	var delimiterField = document.getElementById("delimiterField");
	if (storedDelimiter) {
		delimiter = storedDelimiter;
		if (storedDelimiter === "	") delimiterField.value = "\\t"; // Show tab space as an actual tab identifier to the user
		else delimiterField.value = delimiter;
	}
}
function saveDelimiter() {
	var delimiterField = document.getElementById("delimiterField");
	var delimiterVal = delimiterField.value;
	if (delimiterVal && delimiterVal === "\\t") delimiterVal = "\t"; // .value will escape the tab character \t to \\t, so rewrite it as \t internally
	localStorage.setItem("delimiter", JSON.stringify(delimiterVal));
	delimiter = delimiterVal;
}

var column = 0;
function loadColumn() {
	var storedColumn = parseInt(localStorage.getItem("column"));
	var columnField = document.getElementById("columnField");
	if (storedColumn != null && storedColumn != "undefined") {
		column = storedColumn;
		columnField.value = column;
	}
}
function saveColumn() {
	var columnField = document.getElementById("columnField");
	if (!Number.isInteger(parseInt(columnField.value))) {
		return window.alert("Column must be a number!");
	}
	localStorage.setItem("column", columnField.value);
	column = columnField.value;
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
	// Get and Set checkbox setting
	var rememberSettingsCheckField = document.getElementById("rememberSettingsCheck")
	var rememberSettingsCheck = localStorage.getItem("rememberSettingsCheck");
	if (!loaded && rememberSettingsCheck) {
		if (rememberSettingsCheck === "true") rememberSettingsCheck = true;
		else if (rememberSettingsCheck === "false") rememberSettingsCheck = false;
		rememberSettingsCheckField.checked = rememberSettingsCheck;
	}
	else {
		rememberSettingsCheck = rememberSettingsCheckField.checked;
	}

	// Save checkbox setting
	localStorage.setItem("rememberSettingsCheck", rememberSettingsCheck);

	// Manage settings depending on checkbox setting
	if (!rememberSettingsCheck) {
		removeSettings();
		loaded = true;
	}
	else if (!loaded) {
		loadSettings();
		loaded = true;
	}
	else {
		saveSettings();
	}
}

window.onload = function() {
	// Manage settings
	window.addEventListener("change", rememberSettings);
	rememberSettings();

	// Manage known words file loading
	var knownWordsFileInput = document.getElementById("fileInput");
	knownWordsFileInput.addEventListener("change", processKnownWordsFile);

	// Manage comparison text processing
	var comparisonTextInput = document.getElementById("comparisonTextInput");
	comparisonTextInput.addEventListener("change", processComparisonText);
	processComparisonText();

	// Manage comparison processing
	var compareBtn = document.getElementById("compareBtn");
	compareBtn.addEventListener("click", compare);
}

// Most common words (pronouns, verbs, positions), disconnected verb/adjective auxillaries, particles, and counters, quantifiers and numbers
var grammar = ["しょう", "しよ", "よね", "じゃ", "について", "ついて", "だろう", "でしょう", "とともに", "ともに", "とって", "しか", "など", "とか", "ては", "では", "のみ", "ので", "たい", "たら", "けど", "けれど", "として",  "よう", "ため", "のに", "まま", "ながら", "によって", "なら", "から", "より", "まで", "だった", "でした", "ほど", "ばかり", "たり", "とも", "かしら", "わけ"];
var terms = ["これ", "これら", "それ", "それら", "あれ", "あれら", "この", "その", "こんな", "そんな", "あの", "ここ", "ここに", "そこ", "そこに", "あそこ", "あそこに", "こちら", "こっち", "そっち", "あっち", "どこ", "だれ", "なに", "なん", "何", "なにか", "なんか", "私", "貴方", "貴方方", "我々", "私達", "あの人", "あのかた", "彼女", "彼", "です", "ある", "あります", "おる", "おります", "いる", "います", "どの", "それで", "しかし", "でも", "また", "それとも", "思う", "思います", "ない", "じゃない", "ありません", "いません", "いない", "すべて", "全て", "全部", "そして", "さらに", "そしたら", "それから", "できる", "できます", "できない", "できません", "する", "した", "します", "しました", "彼ら", "彼たち", "僕たち", "俺たち", "俺達", "僕達", "我ら", "俺ら", "私たち", "お前","いいえ","いや", "行く", "行き", "あなた", "貴方", "ください", "下さい", "お願い", "よい", "いい", "どう", "なぜ", "なんで", "こう", "そう", "どなたか", "どなた", "いう", "という", "すぐ", "みんな", "はい", "ところ", "こと", "事", "もの", "物", "自分", "される", "なる", "皆", "なく", "ほしい", "による", "またすぐ", "なか", "及び", "および", "すでに", "ことし", "うち", "くる", "なんと", "ちなみ", "かも", "どれ", "いつ"];
var auxillaries = ["あり", "おり",  "いり", "ありませ", "いませ", "はみんな", "まし", "させ", "さつ", "たうえ", "なり", "とかそういう", "はすぐ", "られ", "とし", "あい", "やら", "すら", "ます", "といて", "そのほか", "ほか", "なだけ", "さえ", "れる", "おい", "だろ", "って", "・", "もらい", "でき", "ませ", "いえ", "ても", "により", "いく", "かけ", "さい", "おら", "はいか", "あげ", "しまい", "ながらこう", "ながらそう", "ものの", "ことの", "わかり", "およ", "じめ", "にかけ", "その後さら", "ときや", "こうし", "いら", "なけれ", "ちゃ", "はいえ", "なみ", "がほぼ", "とえ", "でし", "にけ", "だけど", "とれ", "とて", "のいま", "どういう"];
var modifiers = ["一", "二", "三", "四", "伍", "六", "七", "七", "八", "仇", "十", "関", "前", "まえ", "後", "あと", "時", "とき", "上", "うえ", "下", "した", "右", "左", "中", "それぞれ", "別", "他", "ただ", "だけ", "たち", "たび", "くらい", "ぐらい", "人", "ほう",  "カ月", "用", "向け", "率", "日", "月", "年", "内", "外", "方", "者", "市", "県", "側", "以内", "以上", "以下", "おおよそ", "およそ", "型", "式", "第", "代", "約", "円", "的", "量", "非", "不", "系", "化", "台", "版", "おそらく", "術", "女", "男", "子", "歳", "才", "ごろ", "区", "性", "御", "部", "分", "初", "新", "つ", "杯", "匹", "本", "階", "個", "箇", "个", "ヶ", "枚", "名", "面", "冊", "話", "秒", "月", "泊", "時間", "箇月", "週", "倍", "番", "度", "畳", "場", "倍", "晩", "番", "尾", "文", "秒", "着", "挺", "丁", "町", "代", "段", "段落", "筆", "服", "幅", "振", "学級", "語", "合", "言", "具", "泊", "敗", "箱", "張", "柱", "発", "品", "筆", "歩", "票", "拍子", "字", "児", "錠", "条", "架", "課", "株", "回", "ヶ国", "箇国", "画", "貫", "艦", "系統", "件", "軒", "機", "基", "斤", "戸", "校", "稿", "行", "齣", "コマ", "献", "句", "口", "組", "脚", "客", "曲", "局", "枚", "巻", "幕", "門", "問", "折", "頁", "例", "礼", "輪", "両", "棹", "冊", "席", "隻", "品", "社", "式", "勝", "首", "週", "種", "足", "双", "束", "体", "俵", "滴", "点", "頭", "通", "坪", "粒", "通話", "羽", "把", "話", "夜", "膳", "州", "超", "似", "もう", "全", "小", "大"];

// Concat the above arrays into one
var jpStopWords = [...grammar, ...terms, ...auxillaries, ...modifiers];

// Test whether a term is banned, including: jpStopWords, punctuation, not Japanese language, term starts/ends with "っ"
var jaTest = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;
var kana = /[\u3040-\u309f\u30a0-\u30ff]/;
var punctuation = /[\u3000-\u303f]|[\uff00-\uff9f]|[`~!@#$%^&*()_\-+=\]\[}{';":\/?.>,<]|[\d]/;
let puncReg = new RegExp(punctuation, "g");
function testBanned(term) {
	let res = false;
	if (term.length === 1 && kana.test(term)
		|| jpStopWords.indexOf(term) > -1
		|| punctuation.test(term)
		|| !jaTest.test(term)
		|| term.startsWith("っ")
		|| term.endsWith("っ")) {
		res = true;
	}
	return res;
}

// Purify terms of unnecessary parts
function purify(term) {
	// Remove punctuation
	term = term.replace(puncReg, "");
	// Remove English
	term = term.replace(/[A-Za-z]/g, "");
	// Remove ending する, or します or される
	if (term.endsWith("する") || term.endsWith("します") || term.endsWith("される")) {
		term = term.replace("する", "");
		term = term.replace("します", "");
		term = term.replace("される", "");
	}
	return term;
}

function compare() {
	if (!knownWordsArr || knownWordsArr.length <= 0) {
		return window.alert("Known Words List is Required!");
	}
	if (!segs || segs.length <= 0) {
		return window.alert("Comparison Text is Required!");
	}

	// Record number of matches against the total
	var total = segs.length;
	var matches = 0;
	var newWords = [];
	for (var i = 0; i < segs.length; i++) {
		// Early out if term is banned
		var banTest = testBanned(segs[i]);
		if (banTest) {
			total--;
			continue;
		}

		// Find term matches
		for (var x = 0; x < knownWordsArr.length; x++) {
			var wordListWord = knownWordsArr[x].split(delimiter)[column];

			// Clean known word of unneeded data
			wordListWord = purify(wordListWord);

			// Compare until any equal match is found
			var result = fuzzy.match(wordListWord, segs[i]);

			// 1 and 2 Character Compounds must be 100%
			if (wordListWord.length <= 2 && segs[i].length <= 2 && result >= 100) {
				console.log("100 Result is: " + result + " from " + wordListWord + " & " + segs[i]);
				matches++;
				break;
			}
			// Otherwise, be 60% or above
			else if (wordListWord.length >= 2 && segs[i].length >= 2 && result >= 60) {
				console.log("60 Result is: " + result + " from " + wordListWord + " & " + segs[i]);
				matches++;
				break;
			}
			// Record new words
			else if (x >= knownWordsArr.length-1) {
				newWords.push(segs[i]);
			}
		}
	}

	if (total <= 0) {
		return window.alert("Comparison Text is Required! 2");
	}

	// Display result & new words
	displayResult(matches, total, newWords);
}

/* Gradient fade - Source: https://codepen.io/daviscodesbugs/pen/LyPdwy */
function changeColor(i) {
	i = i || 0;
	var colors = ["#ec4c69", "#f99654", "#f6b93b", "#34c478"]; // red, orange, yellow, green
	var resultDisplay = document.getElementsByClassName("result-display")[0];
	resultDisplay.style.cssText = "background-color: " + colors[i];
}
function displayResult(matches, total, newWords) {
	// Display the result form
	var resultDisplay = document.getElementById("resultDisplay");
	resultDisplay.style.display = "block";

	// Display the number of matches as percent
	var resultPercentField = document.getElementById("resultPercent");
	var resultPercent = Math.floor(matches / total * 100);
	resultPercentField.textContent = resultPercent + "%";
	// Display the number of matches raw
	var resultFractionField = document.getElementById("resultFraction");
	resultFractionField.textContent = matches + " / " + total;

	// Background color waterfall
	if (resultPercent < 25) {
		changeColor(0);
	}
	else if (resultPercent >= 25 && resultPercent < 50) {
		changeColor(1);
	}
	else if (resultPercent >= 50 && resultPercent < 65) {
		changeColor(2);
	}
	else if (resultPercent >= 65) {
		changeColor(3);
	}

	// Display the new words form
	var resultDisplay = document.getElementById("newWordsDisplay");
	resultDisplay.style.display = "block";
	// Display new words
	var newWordsField = document.getElementById("newWords");
	var spacer = " ・ "; //" \r\n"
	var newWordsStr = "";
	for (var i = 0; i < newWords.length; i++) {
		if (i >= newWords.length-1) spacer = "";
		newWordsStr += newWords[i] + spacer;
	}
	newWordsField.textContent = newWordsStr;
}