/*
	MIT License
	Copyright (c) 2018 Kai Krause <kaikrause95@gmail.com>
	See license here: https://github.com/krausekai/Japanese-Text-Difficulty-Checker/blob/master/LICENSE.txt
*/

var kana = /[\u3040-\u309f\u30a0-\u30ff]/;
var kanji = /[\u4e00-\u9faf\u3400-\u4dbf]/;
var fuzzy = {};

fuzzy.substring_kanji = function(shorter, longer) {
	let val = 0;
	if (kanji.test(shorter) && longer.includes(shorter) || kanji.test(longer) && longer.includes(shorter)) {
		val = Math.floor(shorter.length / longer.length * 100);
	}
	return val;
}

fuzzy.substring_kana = function(shorter, longer) {
	let val = 0;
	if (kana.test(shorter) && kana.test(longer) && shorter.length >= 3) {
		if (longer.includes(shorter)) {
			val = Math.floor(shorter.length / longer.length * 100);
		}
	}
	return val;
}

fuzzy.substring_kanaprt = function (shorter, longer) {
	let particles = ["は", "が", "で", "に", "の", "な", "と", "や", "も", "へ", "お", "ご"];
	let lenDiff = Math.abs(shorter.length - longer.length);
	let val = 0;
	if (lenDiff === 1) {
		if (particles.indexOf(longer[0]) > -1) {
			let c_longer = longer.substr(1);
			if (c_longer === shorter) {
				val = 100;
			}
		}
		if (particles.indexOf(longer[longer.length-1]) > -1) {
			let c_longer = longer.slice(0, -1);
			if (c_longer === shorter) {
				val = 100;
			}
		}
	}
	return val;
}

fuzzy.verb_compound = function(shorter, longer) {
	let val = 0;
	if (shorter.length >= 3 && longer.length >= 3
		&& kanji.test(shorter[0]) && kana.test(shorter[1]) && kanji.test(shorter[2])
		&& kanji.test(longer[0]) && kana.test(longer[1]) && kanji.test(longer[2])
		&& shorter[0] === longer[0] && shorter[2] === longer[2]) {
			val = 100;
	}
	return val;
}

fuzzy.kanji_compound = function(shorter, longer) {
	let val = 0;
	if (kana.test(shorter) && kanji.test(shorter) || kana.test(longer) && kanji.test(longer)) {
		let shorterKanjiChars = [];
		let longerKanjiChars = [];
		for (let i = 0; i < shorter.length; i++ ) {
			if (kanji.test(shorter[i])) {
				shorterKanjiChars.push(shorter[i]);
			}
		}
		for (let i = 0; i < longer.length; i++ ) {
			if (kanji.test(longer[i])) {
				longerKanjiChars.push(longer[i]);
			}
		}

		// Check the Kanji compounds as strings
		if (shorterKanjiChars[0] && longerKanjiChars[0]) {
			let shorterKanji;
			let longerKanji;
			if (shorterKanjiChars.length < longerKanjiChars.length) {
				longerKanji = longerKanjiChars.join("");
				shorterKanji = shorterKanjiChars.join("");
			} else {
				longerKanji = shorterKanjiChars.join("");
				shorterKanji = longerKanjiChars.join("");
			}

			// Check whether both Kanji strings are the same, and if so, return a full match (Kanji > Kana)
			if (shorterKanji === longerKanji) {
				val = 100;
			}
			// Check for partial matches by sub string for compounds of 2 or more length by shortest
			else if (shorterKanji.length >= 2 && longerKanji.includes(shorterKanji)) {
				val = Math.floor(shorterKanji.length / longerKanji.length * 100);
			}
		}
	}
	return val;
}

// 0 to 100% (0 no match, 100 perfect match)
fuzzy.match = function(s1, s2) {
	// if both strings are the same, early out
	if (s1 === s2 ) {
		return 100;
	}

	// Total count of matches
	let count = 0;

	// Compare shortest string against the longest string
	let longer = "";
	let shorter = "";
	if (s1.length < s2.length) {
		longer = s2;
		shorter = s1;
	} else {
		longer = s1;
		shorter = s2;
	}

	// Early out if the two word lengths are too different for effeciency
	// eg. StrA is 10, StrB is 25, the diff is 15
	let numDiff = Math.abs(shorter.length - longer.length);
	let fudge = 0;
	if (shorter.length === 1) fudge = 2;
	if (numDiff > shorter.length+fudge) {
		return 0;
	}

	// Substring: Longer includes Shorter as Kanji
	let val1 = fuzzy.substring_kanji(shorter, longer);
	if (val1 > count) count = val1;
	// Substring: Longer includes Shorter as Kana, which is 3 or longer length
	let val2 = fuzzy.substring_kana(shorter, longer);
	if (val2 > count) count = val2;
	// Substring: Longer is longer by 1, and contains a basic particle at the start or end, that removed is equal to the shorter word
	let val3 = fuzzy.substring_kanaprt(shorter, longer);
	if (val3 > count) count = val3;
	// String contains a verb compound (eg. Base verb and auxillary: Kanji-Kana-Kanji)
	let val4 = fuzzy.verb_compound(shorter, longer);
	if (val4 > count) count = val4;
	// String contains Kana and Kanji, and when Kana is removed, the remaining Kanji are compared as a compound, are the same (eg. other verbs and adjectives)
	let val5 = fuzzy.kanji_compound(shorter, longer);
	if (val5 > count) count = val5;

	// Return a weighted result
	return count;
}
