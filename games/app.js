// Centralized configuration and utility functions for all word games.

const CONFIG_KEY = 'wordGameConfig';
const LEGACY_KEY = 'ws_config';
const SAMPLE_PATH = '../sample-words.json';
let bootstrapTriggered = false;

function safeParse(raw, source) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to parse config from ${source}`, error);
    return null;
  }
}

function readConfigFromStorage(storage, key) {
  try {
    return safeParse(storage.getItem(key), `${key} (${storage === sessionStorage ? 'session' : 'local'})`);
  } catch (error) {
    console.warn('Unable to access storage for config', error);
    return null;
  }
}

function persistConfig(config) {
  const serialized = JSON.stringify(config);
  try {
    sessionStorage.setItem(CONFIG_KEY, serialized);
  } catch (error) {
    console.warn('Failed to persist config to sessionStorage', error);
  }
  try {
    localStorage.setItem(CONFIG_KEY, serialized);
  } catch (error) {
    console.warn('Failed to persist config to localStorage', error);
  }
}

function ensureSampleConfig() {
  if (bootstrapTriggered) {
    return;
  }
  bootstrapTriggered = true;
  fetch(SAMPLE_PATH)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const words = Array.isArray(data?.default) ? data.default : [];
      const config = { words, options: {} };
      persistConfig(config);
      location.reload();
    })
    .catch(error => {
      console.error('Failed to load sample-words.json', error);
      const fallback = { words: ['HELLO', 'WORLD', 'GAME'], options: {} };
      persistConfig(fallback);
      location.reload();
    });
}

/**
 * Loads the game configuration from storage.
 * Falls back to bundled sample words if no config has been saved.
 * @returns {object|null} The configuration object or null while bootstrapping.
 */
export function loadConfig() {
  const config =
    readConfigFromStorage(sessionStorage, CONFIG_KEY) ||
    readConfigFromStorage(sessionStorage, LEGACY_KEY) ||
    readConfigFromStorage(localStorage, CONFIG_KEY) ||
    readConfigFromStorage(localStorage, LEGACY_KEY);

  if (config?.words && Array.isArray(config.words) && config.words.length) {
    return config;
  }

  ensureSampleConfig();
  return null;
}

/**
 * Shuffles an array in place.
 * @param {Array} array The array to shuffle.
 * @returns {Array} The shuffled array.
 */
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Normalizes a word by converting it to uppercase and removing non-alphabetic characters.
 * @param {string} word The word to normalize.
 * @returns {string} The normalized word.
 */
export function normalizeWord(word) {
  return String(word || '').replace(/[^A-Za-z]/g, '').toUpperCase();
}

/**
 * Returns a random uppercase letter from the English alphabet.
 * @returns {string} A random letter.
 */
export function randLetter() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}
