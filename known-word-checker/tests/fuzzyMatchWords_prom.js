/*
	MIT License
	Copyright (c) 2018 Kai Krause <kaikrause95@gmail.com>
	See license here: https://github.com/krausekai/Japanese-Text-Difficulty-Checker/blob/master/LICENSE.txt
*/

// Async-Await and Promises are considerably slower - overhead?

var kana = /[\u3040-\u309f\u30a0-\u30ff]/;
var kanji = /[\u4e00-\u9faf\u3400-\u4dbf]/;
var fuzzy = {};

fuzzy.substring_kanji = function(shorter, longer, resolve, reject) {
	setTimeout(() => {
		let val = 0;
		if (kanji.test(shorter) && longer.includes(shorter) || kanji.test(longer) && longer.includes(shorter)) {
			val = Math.floor(shorter.length / longer.length * 100);
		}
		return resolve(val);
	}, 0);
}

fuzzy.substring_kana = function(shorter, longer, resolve, reject) {
	setTimeout(() => {
		let val = 0;
		if (kana.test(shorter) && kana.test(longer) && shorter.length >= 3) {
			if (longer.includes(shorter)) {
				val = Math.floor(shorter.length / longer.length * 100);
			}
		}
		return resolve(val);
	}, 0);
}

fuzzy.verb_compound = function(shorter, longer, resolve, reject) {
	setTimeout(() => {
		let val = 0;
		if (shorter.length >= 3 && longer.length >= 3
			&& kanji.test(shorter[0]) && kana.test(shorter[1]) && kanji.test(shorter[2])
			&& kanji.test(longer[0]) && kana.test(longer[1]) && kanji.test(longer[2])
			&& shorter[0] === longer[0] && shorter[2] === longer[2]) {
				val = 100;
		}
		return resolve(val);
	}, 0);
}

fuzzy.kanji_compound = function(shorter, longer, resolve, reject) {
	setTimeout(() => {
		let val = 0;
		if (kana.test(shorter) && kanji.test(shorter) || kana.test(longer) && kanji.test(longer)) {
			var shorterKanjiChars = [];
			var longerKanjiChars = [];
			for (var i = 0; i < shorter.length; i++ ) {
				if (kanji.test(shorter[i])) {
					shorterKanjiChars.push(shorter[i]);
				}
			}
			for (var i = 0; i < longer.length; i++ ) {
				if (kanji.test(longer[i])) {
					longerKanjiChars.push(longer[i]);
				}
			}

			// Check the Kanji compounds as strings
			if (shorterKanjiChars[0] && longerKanjiChars[0]) {
				var shorterKanji;
				var longerKanji;
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
		return resolve(val);
	}, 0);
}

// 0 to 100% (0 no match, 100 perfect match)
fuzzy.match = async function(s1, s2) {
	// if both strings are the same, early out
	if (s1 === s2 ) {
		return 100;
	}

	// Total count of matches
	var count = 0;

	// Compare shortest string against the longest string
	var longer = "";
	var shorter = "";
	if (s1.length < s2.length) {
		longer = s2;
		shorter = s1;
	} else {
		longer = s1;
		shorter = s2;
	}

	// Early out if the two word lengths are too different for effeciency
	// eg. StrA is 10, StrB is 25, the diff is 15
	var numDiff = Math.abs(shorter.length - longer.length);
	if (numDiff > shorter.length) {
		return 0;
	}

	var promises = [];

	// Substring: Kanji only test
	promises.push(new Promise(async function(resolve, reject) {
		fuzzy.substring_kanji(shorter, longer, resolve, reject);
	}));
	// Substring: Kana must be 3 or longer length
	promises.push(new Promise(async function(resolve, reject) {
		fuzzy.substring_kana(shorter, longer, resolve, reject);
	}));
	// string contains a verb compound (eg. Base verb and auxillary: Kanji-Kana-Kanji) (Kanji > Kana)
	promises.push(new Promise(async function(resolve, reject) {
		fuzzy.verb_compound(shorter, longer, resolve, reject);
	}));
	// Else, check if string contains Kana and Kanji & rip Kanji to compare as a compound (eg. other verbs and adjectives)
	promises.push(new Promise(async function(resolve, reject) {
		fuzzy.kanji_compound(shorter, longer, resolve, reject);
	}));

	return Promise.all(promises).then((res) => {
		// Return a weighted result
		if (res[0] > count) count = res[0];
		if (res[1] > count) count = res[1];
		if (res[2] > count) count = res[2];
		if (res[3] > count) count = res[3];
		return count;
	});
}
