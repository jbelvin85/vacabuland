import { loadConfig, shuffle, normalizeWord } from './app.js';

const defaultSettings = {
    minLength: 3,
    maxLength: 8,
    timeLimit: 60,
    hintCount: 3
};

function getSettings() {
    const saved = localStorage.getItem('wordGamesSettings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const anagram = parsed?.games?.anagram || {};
            return {
                minLength: Number.isInteger(anagram.minLength) ? anagram.minLength : defaultSettings.minLength,
                maxLength: Number.isInteger(anagram.maxLength) ? anagram.maxLength : defaultSettings.maxLength,
                timeLimit: Number.isInteger(anagram.timeLimit) ? anagram.timeLimit : defaultSettings.timeLimit,
                hintCount: Number.isInteger(anagram.hintCount) ? anagram.hintCount : defaultSettings.hintCount
            };
        } catch (error) {
            console.error('Error parsing settings, using defaults.', error);
        }
    }
    return { ...defaultSettings };
}

const settings = getSettings();
if (settings.minLength > settings.maxLength) {
    [settings.minLength, settings.maxLength] = [settings.maxLength, settings.minLength];
}
settings.minLength = Math.max(3, Math.min(settings.minLength, 15));
settings.maxLength = Math.max(3, Math.min(settings.maxLength, 15));
settings.timeLimit = Math.max(0, Math.min(settings.timeLimit, 600));
settings.hintCount = Math.max(0, Math.min(settings.hintCount, 10));

const cfg = loadConfig() || { words: ['SAMPLE', 'WORDS', 'HERE'], options: {} };
const allWords = Array.from(new Set(cfg.words.map(normalizeWord))).filter(Boolean);

function filterWordsByLength(words, min, max) {
    return words.filter(word => word.length >= min && word.length <= max);
}

let words = filterWordsByLength(allWords, settings.minLength, settings.maxLength);
if (!words.length) {
    console.warn('No words matched settings criteria; using full list.');
    words = allWords;
}

// --- GAME STATE --- //
let index = 0;
let score = 0;
let timerInterval;
let hintsRemaining = settings.hintCount;

// --- DOM ELEMENTS --- //
const scrambledEl = document.getElementById('scrambled');
const ans = document.getElementById('answer');
const fb = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');
const timerEl = document.getElementById('timer');
const hintBtn = document.getElementById('hintBtn');

totalEl.textContent = words.length;

function updateHintButton() {
    if (!hintBtn) return;
    if (settings.hintCount <= 0) {
        hintBtn.style.display = 'none';
        return;
    }
    hintBtn.style.display = '';
    hintBtn.disabled = hintsRemaining <= 0;
    hintBtn.textContent = hintsRemaining > 0 ? `Hint (${hintsRemaining} left)` : 'Hint (0 left)';
}

function scrambleWord(word) {
    let arr = word.split('');
    let out = word;
    let tries = 0;
    while (out === word && tries < 20) {
        out = shuffle(arr).join('');
        tries++;
    }
    return out;
}

function startTimer() {
    if (!timerEl) return;
    if (settings.timeLimit <= 0) {
        timerEl.textContent = '';
        return;
    }
    let timeLeft = settings.timeLimit;
    timerEl.textContent = timeLeft;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            fb.textContent = `Time's up! The word was ${words[index]}.`;
            index++;
            setTimeout(show, 2000);
        }
    }, 1000);
}

function show() {
    clearInterval(timerInterval);
    if (!words.length) {
        scrambledEl.textContent = 'No words available. Adjust settings or word list.';
        fb.textContent = '';
        return;
    }
    if (index >= words.length) {
        scrambledEl.textContent = 'All done!';
        fb.textContent = 'Great job!';
        return;
    }
    const word = words[index];
    scrambledEl.textContent = scrambleWord(word);
    ans.value = '';
    ans.focus();
    fb.textContent = '';
    startTimer();
}

function check() {
    const guess = normalizeWord(ans.value);
    const target = words[index];

    if (!guess) {
        fb.textContent = 'Type your answer.';
        return;
    }

    if (guess === target) {
        score++;
        scoreEl.textContent = score;
        fb.textContent = 'Correct!';
        clearInterval(timerInterval);
        index++;
        setTimeout(show, 800);
    } else {
        fb.textContent = 'Try again.';
    }
}

function showHint() {
    if (!hintBtn) return;
    if (settings.hintCount <= 0) return;
    if (hintsRemaining <= 0) {
        fb.textContent = 'No hints left.';
        return;
    }
    const target = words[index];
    hintsRemaining--;
    updateHintButton();
    fb.textContent = `Hint: Starts with '${target[0]}' and has ${target.length} letters.`;
}

// --- EVENT LISTENERS --- //
document.getElementById('checkBtn').addEventListener('click', check);
document.getElementById('skipBtn').addEventListener('click', () => {
    clearInterval(timerInterval);
    index++;
    show();
});
document.getElementById('shuffleBtn').addEventListener('click', () => {
    const word = words[index];
    scrambledEl.textContent = scrambleWord(word);
});

if (hintBtn) {
    hintBtn.addEventListener('click', showHint);
    updateHintButton();
}

ans.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        check();
    }
});

// --- INITIALIZATION --- //
show();
