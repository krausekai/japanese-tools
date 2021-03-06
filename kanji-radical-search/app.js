/*
	MIT License
	Copyright (c) 2018 Kai Krause <kaikrause95@gmail.com>
	See license here: https://github.com/krausekai/Japanese-Text-Difficulty-Checker/blob/master/LICENSE.txt
*/

/* Return a unique array - Source: https://stackoverflow.com/a/9229821 */
function uniq_fast(a) {
	let seen = {};
	let out = [];
	let len = a.length;
	let j = 0;
	for(let i = 0; i < len; i++) {
		let item = a[i];
		if(seen[item] !== 1) {
		seen[item] = 1;
		out[j++] = item;
		}
	}
	return out;
}

// SET RADICAL SET
let radical_set = "kangxi";
function loadRadicalSet() {
	radical_set = document.getElementById("radicalSet").value;
	// reset loaded data
	clearSelected();
	// load/reload the UI
	createDuplicateIndex();
	populateGUI();
}

// helper function to find duplicate radicals, and translate them to the first found radical's ID
let duplicates_index = {};
function createDuplicateIndex() {
	duplicates_index = {};
	let ids = [];
	let meanings = [];
	for (let radical in radicals) {
		let index;
		if (radical_set === "houhou") {
			index = meanings.indexOf(radicals[radical].houhou_radical_meaning);
			if (index === -1) {
				ids.push(radical);
				meanings.push(radicals[radical].houhou_radical_meaning);
			}
		}
		if (radical_set === "kangxi") {
			index = meanings.indexOf(radicals[radical].kangxi_radical_meaning);
			if (index === -1) {
				ids.push(radical);
				meanings.push(radicals[radical].kangxi_radical_meaning);
			}
		}
		if (radical_set === "wanikani") {
			index = meanings.indexOf(radicals[radical].wk_radical_meaning);
			if (index === -1) {
				ids.push(radical);
				meanings.push(radicals[radical].wk_radical_meaning);
			}
		}
		if (index && index > -1) {
			duplicates_index[radical] = ids[index].toString();
		}
	}
}

function purifyRadicals(arr) {
	if (!arr) return arr;
	// replace duplicate radical IDs with the original ID
	for (let i = 0; i < arr.length; i++) {
		if (duplicates_index[arr[i]]) {
			arr[i] = duplicates_index[arr[i]];
		}
	}
	// remove repeating IDs from arr
	arr = uniq_fast(arr);
	// remove IDs which are NULL
	for (let i = 0; i < arr.length; i++) {
		if (radical_set === "houhou") {
			if (radicals[arr[i]] && !radicals[arr[i]].houhou_radical_meaning) {
				arr.splice(i, 1);
			}
		}
		if (radical_set === "kangxi") {
			if (radicals[arr[i]] && !radicals[arr[i]].kangxi_radical_meaning) {
				arr.splice(i, 1);
			}
		}
		if (radical_set === "wanikani") {
			if (radicals[arr[i]] && !radicals[arr[i]].wk_radical_meaning) {
				arr.splice(i, 1);
			}
		}
	}
	return arr;
}

// POPULATE THE GUI
function populateGUI() {
	let radicalGrid = document.getElementById("radicalGrid").getElementsByTagName("ul")[0];
	let radicalGridHtml = "";
	for (let radical in radicals) {
		if (!duplicates_index[radical]) {
			if (radical_set === "houhou") {
				if (radicals[radical].houhou_radical && radicals[radical].houhou_radical_meaning) {
					radicalGridHtml += "<li id='" + radical + "'>"
					radicalGridHtml += "<span class='radical'>" + radicals[radical].houhou_radical + "</span>" + "<br />";
					radicalGridHtml += "<span class='meaning'>" + radicals[radical].houhou_radical_meaning + "</span>";
					radicalGridHtml += "</li>"
				}
			}
			if (radical_set === "kangxi") {
				if (radicals[radical].kangxi_radical && radicals[radical].kangxi_radical_meaning) {
					radicalGridHtml += "<li id='" + radical + "'>"
					radicalGridHtml += "<span class='radical'>" + radicals[radical].kangxi_radical + "</span>" + "<br />";
					radicalGridHtml += "<span class='meaning'>" + radicals[radical].kangxi_radical_meaning + "</span>";
					radicalGridHtml += "</li>"
				}
			}
			if (radical_set === "wanikani") {
				if (radicals[radical].wk_radical && radicals[radical].wk_radical_meaning && !radicals[radical].wk_image) {
					radicalGridHtml += "<li id='" + radical + "'>"
					radicalGridHtml += "<span class='radical'>" + radicals[radical].wk_radical + "</span>" + "<br />";
					radicalGridHtml += "<span class='meaning'>" + radicals[radical].wk_radical_meaning + "</span>";
					radicalGridHtml += "</li>"
				}
				else if (radicals[radical].wk_image && radicals[radical].wk_radical_meaning) {
					radicalGridHtml += "<li id='" + radical + "'>"
					radicalGridHtml += "<img src='" + radicals[radical].wk_image + "' />" + "<br />";
					radicalGridHtml += "<span class='meaning'>" + radicals[radical].wk_radical_meaning + "</span>";
					radicalGridHtml += "</li>"
				}
			}
		}
	}
	radicalGrid.innerHTML = radicalGridHtml;
}

// decipher text type to search for meaning, reading, or kanji
let searchText = "";
function search() {
	searchText = document.getElementById("searchText").value;
	if (!searchText) return;

	// Roman characters
	if (/[A-Za-z]/.test(searchText[0]) && searchText.length > 2) {
		searchMeaning(searchText);
	}
	// Kana characters
	else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(searchText[0])) {
		searchReading(searchText);
	}
	// Kanji characters
	else {
		searchKanji(searchText[0]);
	}
}

function searchKanji(term) {
	// search for the kanji from the first character, and fail if not found
	let kanjiObj = kanjis[term];
	if (!kanjiObj) {
		return clearSelected();
	}

	// get all radical IDs and purify them
	let kanji_radical_ids = kanjiObj.radical_id.toString();
	let kanji_radical_ids_arr = kanji_radical_ids.split(", ");
	kanji_radical_ids_arr = purifyRadicals(kanji_radical_ids_arr);

	// assign as selection
	selectedRadicals = kanji_radical_ids_arr;
	selectRadicals("override");
}

function searchReading(term) {
	// reset displays
	clearSelected();

	// search for kanji matching English definition
	for (let kanji in kanjis) {
		let onyomi = kanjis[kanji].onyomi.split(",");
		let kunyomi = kanjis[kanji].kunyomi.split(",");
		let nanori = kanjis[kanji].nanori.split(",");
		let readings = [...onyomi, ...kunyomi, ...nanori];

		for (let i = 0; i < readings.length; i++) {
			readings[i] = readings[i].replace(/\./gm, "");
			if (readings[i].startsWith(term)) {
				matchingKanjis.push(kanji);
			}
		}
	}
	displayMatchingKanji();
}

function searchMeaning(term) {
	// reset displays
	clearSelected();

	// search for kanji matching English definition
	for (let kanji in kanjis) {
		if (kanjis[kanji].meaning.includes(term)) {
			matchingKanjis.push(kanji);
		}
	}
	displayMatchingKanji();
}

// GET KANJIS WHICH MATCH RADICAL SELECTION
let selectedRadicals = [];
let matchingKanjis = [];
let matchingRadicals = [];
function selectRadicals(e) {
	if (e !== "override") {
		// get the radical id from the pushed li button
		let elementType = e.target.tagName;
		let elementId = e.target.id.toString();
		if (elementType.toLowerCase() !== "li" || !elementId) {
			return;
		}

		// remove selected radical if it is already selected
		let index = selectedRadicals.indexOf(elementId);
		if (index > -1) {
			selectedRadicals.splice(index, 1);
		}
		// otherwise push to selection
		else {
			selectedRadicals.push(elementId);
		}
	}

	matchingKanjis = [];
	matchingRadicals = [];

	// search Kanji list, but only if there are selected radicals
	// this prevents all radicals being pushed to matchingRadicals, and being incorrectly shown by displaySelectedRadicals()
	if (selectedRadicals && selectedRadicals[0]) {
		for (let kanji in kanjis) {
			if (kanjis[kanji].radical_id) {
				// get all radical IDs and purify them
				let kanji_radical_ids = kanjis[kanji].radical_id.toString();
				let kanji_radical_ids_arr = kanji_radical_ids.split(", ");
				kanji_radical_ids_arr = purifyRadicals(kanji_radical_ids_arr);

				// whether to accept the current kanji as a match
				let doMatch = true;

				// for-loop through every item in selected radicals and check that it exists in the kanji's radicals
				for (let i = 0; i < selectedRadicals.length; i++) {
					let index = kanji_radical_ids_arr.indexOf(selectedRadicals[i]);
					// remove currently selected IDs from matched Kanji, so the remaining IDs can be highlighted for other possible radical combinations
					if (index > -1) {
						kanji_radical_ids_arr.splice(index, 1);
					}
					// otherwise, fail the entire kanji
					else if (index === -1) {
						doMatch = false;
					}
				}

				// highlight other possible radical combinations
				if (doMatch) {
					matchingRadicals = matchingRadicals.concat(kanji_radical_ids_arr);
				}

				// return all matching kanjis
				if (doMatch) {
					matchingKanjis.push(kanji);
				}

			}
		}
	}
	// display selected radicals via background colors
	displaySelectedRadicals();
	// and display matched kanji
	displayMatchingKanji();
}

function displaySelectedRadicals() {
	matchingRadicals = uniq_fast(matchingRadicals);
	let radicalGrid = document.getElementById("radicalGrid");
	let radicals = radicalGrid.getElementsByTagName("li");

	for (let i = 0; i < radicals.length; i++) {
		let radical = radicals[i].id;
		// highlight selected
		if (selectedRadicals && selectedRadicals.indexOf(radical) > -1) {
			radicals[i].style.backgroundColor = "#71f77a";
		}
		// highlight radicals that can match with current radicals
		else if (matchingRadicals && matchingRadicals.indexOf(radical) > -1) {
			radicals[i].style.backgroundColor = "#c5f7c5";
		}
		// remove non-selected
		else {
			radicals[i].style.backgroundColor = "";
		}
	}

	// Display the count of selected and matched radicals
	let radicalSelectedCount = document.getElementById("radicalSelectedCount");
	let radicalMatchingCount = document.getElementById("radicalMatchingCount");
	if (radicalSelectedCount && radicalMatchingCount) {
		radicalSelectedCount.innerText = selectedRadicals.length;
		radicalMatchingCount.innerText = matchingRadicals.length;
	}
}

function displayMatchingKanji() {
	let focusedKanji = document.getElementById("focusedKanji");
	focusedKanji.innerText = "No Kanji is selected";
	let foundKanji = document.getElementById("foundKanji");
	if (matchingKanjis && !matchingKanjis[0]) {
		foundKanji.innerText = "No results to display";
	}
	else {
		let text = "";
		for (let i = 0; i < matchingKanjis.length; i++) {
			// highlight the currently searched Kanji
			if (matchingKanjis[i] === searchText[0]) matchingKanjis[i] = "<b>" + matchingKanjis[i] + "</b>";
			// create the output
			text += "<li class='kanjiResult'>" + matchingKanjis[i] + "</li>";
		}
		foundKanji.innerHTML = "<ul>" + text + "</ul>";
	}
}

// reset found data, background colors, and displayed kanji
function clearSelected() {
	selectedRadicals = [];
	matchingKanjis = [];
	matchingRadicals = [];
	displaySelectedRadicals();
	displayMatchingKanji();
}

function focusKanji(e) {
	let focusedKanji = document.getElementById("focusedKanji");
	let elementText = e.target.innerText;
	let elementType = e.target.tagName;
	if (elementType.toLowerCase() !== "li" || !elementText || !kanjis[elementText]) return;

	let kanji = kanjis[elementText];
	let kanjiInfo = "";

	if (!kanji.meaning) kanji.meaning = "...";
	if (!kanji.onyomi) kanji.onyomi = "...";
	if (!kanji.kunyomi) kanji.kunyomi = "...";
	if (!kanji.nanori) kanji.nanori = "...";

	kanjiInfo += "<span class='radical'>" + elementText + "</span><br />";
	kanjiInfo += "<b>Meaning:</b><br />";
	kanjiInfo += kanji.meaning + "<br />";
	kanjiInfo += "<b>On'yomi:</b><br />";
	kanjiInfo += kanji.onyomi + "<br />";
	kanjiInfo += "<b>Kun'yomi:</b><br />"
	kanjiInfo += kanji.kunyomi + "<br />";
	kanjiInfo += "<b>Nanori:</b><br />";
	kanjiInfo += kanji.nanori + "<br />";

	focusedKanji.innerHTML = kanjiInfo;
}

window.onload = function() {
	document.getElementById("radicalSet").addEventListener("change", loadRadicalSet);
	loadRadicalSet();
	document.getElementById("searchText").addEventListener("focus", search);
	document.getElementById("searchText").addEventListener("input", search);
	//document.getElementById("searchBtn").addEventListener("click", search);
	document.getElementById("clearSelected").addEventListener("click", clearSelected);
	document.addEventListener("click", selectRadicals);
	document.getElementById("foundKanji").addEventListener("click", focusKanji); // mouseover
}