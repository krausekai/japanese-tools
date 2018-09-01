var prevText;
var answers;

function preloadText() {
	if (location.search) {
		// May need to sanitize this...
		var clozeTextField = document.getElementById('clozeTextField');
		clozeTextField.value = decodeURIComponent(location.search.substring(1));
	}
}
window.addEventListener("DOMContentLoaded", function load() {
	window.removeEventListener("DOMContentLoaded", load, false);
	preloadText();
}, false);

function main(text) {
	var clozeTextField = document.getElementById('clozeTextField');
	text = clozeTextField.value || prevText;

	//Store the text, in case difficulty is changed later
	prevText = text;

	var result = processText(text);
	if (result) {
		showHideMenu();
		document.getElementById('clozeTestResultField').innerHTML = result;
	}
}
document.getElementById("clozeTextSubmitBtn").addEventListener('click', main);

function processText(text) {
	var segs = segment(text);
	var selectedEntries = [];
	var entry, entryType, nextEntry, nextEntryType;

	// Filter segmentation
	for (var i = 0, len = segs.length; i < len; i++) {
		if (!segs[i+1]) break;
		entry = segs[i][0];
		entryType = segs[i][1];
		nextEntry = segs[i+1][0];
		nextEntryType = segs[i+1][1];

		var firstHalf, secondHalf, ignoreFirstHalf, ignoreSecondHalf;

		// Verb halves
		firstHalf = ['V-c', 'V-dp'];
		secondHalf = ['V-dp', 'P-sj', 'P-fj', 'P-rj', 'X'];
		ignoreSecondHalf = ['けど', 'が'];
		if (ignoreSecondHalf.indexOf(nextEntry) === -1) {
			if (firstHalf.indexOf(entryType) > -1 && secondHalf.indexOf(nextEntryType) > -1) {
				segs[i][0] = entry + nextEntry;
				segs.splice(i+1, 1);
				i--;
				len--;
			}
		}
		// Noun-verbs
		if (entryType == 'N-nc' && nextEntryType == 'V-dp') {
			segs[i][0] = entry + nextEntry;
			segs[i][1] = nextEntryType; // Make it a verb
			segs.splice(i+1, 1);
			i--;
			len--;
		}
		// Nouns
		firstHalf = ['だっ'];
		secondHalf = ['た'];
		if (firstHalf.indexOf(entry) > -1 && secondHalf.indexOf(nextEntry) > -1) {
			segs[i][0] = entry + nextEntry;
			segs[i][1] = nextEntryType; // Make it a verb
			segs.splice(i+1, 1);
			i--;
			len--;
		}
		// Adjective halves
		firstHalf = ['A-dp', 'D', 'X', 'A-c'];
		secondHalf = ['J-xs', 'X', 'P-sj', 'A-dp', 'Q-n'];
		ignoreFirstHalf = ['何'];
		if (ignoreFirstHalf.indexOf(entry) === -1) {
			if (firstHalf.indexOf(entryType) > -1 && secondHalf.indexOf(nextEntryType) > -1 || entryType == 'Q-a' && nextEntryType == 'A-c' || entryType == 'A-c' && nextEntryType == 'I-c') {
				segs[i][0] = entry + nextEntry;
				segs.splice(i+1, 1);
				len--;
			}
		}
		// Quantifiers
		if (entryType == 'N-n' && nextEntryType == 'Q-n') {
			segs[i][0] = entry + nextEntry;
			segs.splice(i+1, 1);
			len--;
		}
	}

	// Verify difficulty
	var difficultyType = difficulty.type();
	if (!difficultyType) return;

	// Apply difficulty: nWords, nouns, adjectives, verbs
	for (var i = 0; i < segs.length; i++) {
		var canPush = false;

		if (difficultyType.includes('nWords')) {
			canPush = true;
			var factorOfItemToChange = difficulty.nWordFactor();
			if (factorOfItemToChange != 1) {
				i += factorOfItemToChange;
			}
			if (!segs[i]) break;
		}

		entry = segs[i][0];
		entryType = segs[i][1];

		// Filter out auxillaries, grammar, punctuation, numbers and spaces
		var bannedTypes = ['M-c', 'M-cp', 'M-p', 'M-op', 'N-n', 'R', 'S-c', 'S-l', 'U', 'W', 'Q-n'];
		var bannedTerms = ['で', 'って', 'な', 'たち', 'だ', 'です']
		if (bannedTypes.indexOf(entryType) > -1 || entryType.startsWith('P') || bannedTerms.indexOf(entry) > -1) {
			// nWords: Go back a step and try the next term
			if (difficultyType.includes('nWords')) {
				if (factorOfItemToChange >= 2) {
					i = i - factorOfItemToChange;
				}
			}
			continue;
		}

		var nounTypes = ['N-n', 'N-nc', 'N-pn', 'N-xs', 'Q-n', 'P'];
		if (difficultyType.includes('nouns') && nounTypes.indexOf(entryType) > -1) {
			canPush = true;
		}
		var adjectiveTypes = ['A-c', 'A-dp'];
		if (difficultyType.includes('adjectives') && adjectiveTypes.indexOf(entryType) > -1) {
			canPush = true;
		}
		var verbTypes = ['V-c', 'V-dp'];
		if (difficultyType.includes('verbs') && verbTypes.indexOf(entryType) > -1) {
			canPush = true;
		}

		if (canPush) {
			var width = '75px';
			selectedEntries.push(entry + '_-' + i + '-_'); // Give each answerable field an ID to compare later
			segs[i][0] = '<input type="text" class="answerField" style="width:' + width + '" id="' + entry + '_-' + i + '-_' + '"></input>';
		}
	}

	// Remove entryTypes
	for (var i = 0; i < segs.length; i++) {
		//segs[i][1] = '';
		segs[i] = segs[i][0];
	}

	//Store our IDs (answers) of each text input to compare later.
	answers = JSON.stringify(selectedEntries);

	//Set our join character between text and format the output
	var output = segs.join("");
	return output;
}

//Implement changeLanguage(), showHideMenu(), difficulty(), checkAnswers()
function changeLanguage() {
	var language = document.getElementById("languageMenu").value;
	var loc = location.href.match('.+(?=\/)');
	if (language == 'en') {
		location.assign(loc[0] + '/index.html');
	} else if (language == 'ja') {
		location.assign(loc[0] + '/index-ja.html');
	}
}
document.getElementById("languageMenu").addEventListener("change", changeLanguage);

var tick = false;
function showHideMenu() {
	if (!tick) tick = true;
	else if (tick) tick = false;

	var inputForm = document.getElementById('inputForm');
	var clozeCheckAnswersBtn = document.getElementById('clozeCheckAnswersBtn');

	if (tick) {
		inputForm.style.display = 'none';
		clozeCheckAnswersBtn.style.display = 'inherit';
	} else {
		inputForm.style.display = 'inherit';
		clozeCheckAnswersBtn.style.display = 'none';
	}
}

/*
	DIFFICULTY
*/
var difficulty = {};
difficulty.verifyOptions = function () {
	var options = document.getElementsByName('options');
	var radio = false;
	var checkbox = false;
	for (var i = 0; i < options.length; i++) {
		if (options[i].type == 'radio' && options[i].checked){
			radio = true;
		}
		if (options[i].type == 'checkbox' && options[i].checked){
			checkbox = true;
		}
	}
	if (radio && checkbox) {
		// reset difficulty options menu
		for (var i = 0; i < options.length; i++) {
			options[i].checked = false;
		}
	}
}
document.getElementById("clozeTestOptions").addEventListener("change", difficulty.verifyOptions);

difficulty.type = function () {
	var options = document.getElementsByName('options');
	var vals = "";
	for (var i = 0; i < options.length; i++) {
		if (options[i].checked) {
			vals += options[i].value;
			if (i == options.length - 1) {
				vals += ',';
			}
		}
	}
	return vals;
}

difficulty.nWordFactor = function() {
	var factor = parseInt(document.getElementById("clozeTestDifficultyDrpdwn").value);
	if (!factor) {
		factor = 3
	}
	return factor;
}
/*
	/END DIFFICULTY
*/

function checkAnswers() {
	// Get our answer-IDs from cache, and search for them
	answers = JSON.parse(answers);
	for (var i = 0; i < answers.length; ++i){
		// Get each answerable field's ID
		var answerField = document.getElementById(answers[i]);
		// Extract the answer, after stripping the ID from the field
		var chosenClozeTestAnswer = answers[i].replace(/_-(.*)-_$/, "");
		// Compare the inputted answer with the answer from the field's ID
		if (answerField.value != chosenClozeTestAnswer){
			// Insert the correct answer, if incorrect, next to the answer fields
			var clozeTestAnswerStyled = "<span style=\"color:red\">" + chosenClozeTestAnswer+ "</span>";
			answerField.insertAdjacentHTML("afterend", clozeTestAnswerStyled);
		}
	}
	// Then, remove all answer-IDs from cache (also prevents displaying the answers twice)
	answers = undefined;

	showHideMenu();
}
document.getElementById("clozeCheckAnswersBtn").addEventListener("click", checkAnswers);
