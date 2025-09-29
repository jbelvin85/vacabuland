import { saveConfig } from './config.js';

const vocabSelector = document.getElementById('vocabularySelector');
const gameButtons = document.querySelectorAll('.game-button');
const LIST_STORAGE_KEY = 'wordGameLists';
const SETTINGS_KEY = 'wordGamesSettings';
const LAST_SELECTION_KEY = 'wordGameLastList';
const WORD_LIST_ENDPOINT = '/api/wordlists';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function getLists() {
  try {
    const raw = localStorage.getItem(LIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Could not parse word lists from localStorage', error);
    return {};
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Could not parse game settings from localStorage', error);
    return null;
  }
}

function getLastSelection() {
  try {
    return localStorage.getItem(LAST_SELECTION_KEY) || '__default';
  } catch (error) {
    console.warn('Could not read last vocabulary selection', error);
    return '__default';
  }
}

function rememberSelection(value) {
  try {
    localStorage.setItem(LAST_SELECTION_KEY, value);
  } catch (error) {
    console.warn('Could not persist last vocabulary selection', error);
  }
}

function saveListsLocally(lists) {
  localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(lists));
}

async function syncListsFromServer() {
  try {
    const response = await fetch(WORD_LIST_ENDPOINT, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    const data = await response.json();
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const sanitized = {};
      Object.keys(data).forEach(name => {
        const words = data[name];
        if (Array.isArray(words)) {
          const cleaned = words.map(word => String(word || '').trim()).filter(Boolean);
          if (cleaned.length > 0) {
            sanitized[name] = cleaned;
          }
        }
      });
      saveListsLocally(sanitized);
    }
  } catch (error) {
    console.warn('Unable to fetch word lists from the server.', error);
  }
}

const listsSyncPromise = syncListsFromServer();

function populateSelector() {
  if (!vocabSelector) {
    return;
  }
  vocabSelector.innerHTML = '';
  const lists = getLists();
  const listNames = Object.keys(lists).sort();

  const defaultOption = document.createElement('option');
  defaultOption.value = '__default';
  defaultOption.textContent = 'Default Sample Words';
  vocabSelector.appendChild(defaultOption);

  listNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    vocabSelector.appendChild(option);
  });

  const lastSelected = getLastSelection();
  if (listNames.includes(lastSelected) || lastSelected === '__default') {
    vocabSelector.value = lastSelected;
  }
}

function buildWordSearchOptions(settings) {
  const defaults = { gridSize: 12, cellSize: 36, allowDiagonals: true, allowBackwards: true, showWordList: true };
  const stored = settings?.games?.wordsearch || {};
  return {
    size: clamp(parseInt(stored.gridSize ?? defaults.gridSize, 10) || defaults.gridSize, 8, 24),
    cellSize: clamp(parseInt(stored.cellSize ?? defaults.cellSize, 10) || defaults.cellSize, 28, 48),
    allowDiagonals: stored.allowDiagonals !== false,
    allowBackwards: stored.allowBackwards !== false,
    showWordList: stored.showWordList !== false
  };
}

if (vocabSelector) {
  vocabSelector.addEventListener('change', () => rememberSelection(vocabSelector.value));
}

gameButtons.forEach(button => {
  button.addEventListener('click', async event => {
    event.preventDefault();
    await listsSyncPromise.catch(() => {});

    const selectedListName = vocabSelector ? vocabSelector.value : '__default';
    const lists = getLists();
    let words = [];

    if (selectedListName === '__default') {
      words = ['learning', 'fun', 'game', 'words', 'play', 'happy', 'school', 'friend'];
    } else if (Array.isArray(lists[selectedListName])) {
      words = lists[selectedListName];
    }

    if (words.length === 0) {
      alert('Please go to Settings and create a word list, or select the default words!');
      return;
    }

    rememberSelection(selectedListName);

    const gameUrl = button.dataset.game;
    let options = {};

    if (gameUrl === 'games/wordsearch.html') {
      options = buildWordSearchOptions(loadSettings());
    }

    const config = { words, options, gameType: gameUrl };
    saveConfig(config);
    location.href = gameUrl;
  });
});

listsSyncPromise.finally(() => populateSelector());
