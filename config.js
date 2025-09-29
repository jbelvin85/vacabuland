const CONFIG_KEY = 'wordGameConfig';
const LEGACY_KEY = 'ws_config';

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch (error) {
    console.warn('Unable to persist config to storage', error);
  }
}

function safeGet(storage, key) {
  try {
    const saved = storage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Unable to read config from storage', error);
    return null;
  }
}

export function saveConfig(config) {
  const serialized = JSON.stringify(config);
  safeSet(sessionStorage, CONFIG_KEY, serialized);
  safeSet(localStorage, CONFIG_KEY, serialized);
}

export function loadConfig() {
  return (
    safeGet(sessionStorage, CONFIG_KEY) ||
    safeGet(sessionStorage, LEGACY_KEY) ||
    safeGet(localStorage, CONFIG_KEY) ||
    safeGet(localStorage, LEGACY_KEY)
  );
}
