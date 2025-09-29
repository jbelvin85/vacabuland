document.addEventListener('DOMContentLoaded', () => {
    // From settings.js
    const mainTabButtons = document.querySelectorAll('.header-button');
    const mainTabPanels = document.querySelectorAll('.tab-panel');
    const subTabButtons = document.querySelectorAll('.sub-header-button');

    // From vocabulary.js
    const newListNameInput = document.getElementById('newListName');
    const newWordInput = document.getElementById('newWordInput');
    const saveNewButton = document.getElementById('saveNewButton');
    const listNameInput = document.getElementById('listName');
    const wordInput = document.getElementById('wordInput');
    const saveButton = document.getElementById('saveButton');
    const listSelector = document.getElementById('listSelector');
    const loadButton = document.getElementById('loadButton');
    const deleteButton = document.getElementById('deleteButton');
    const exportButton = document.getElementById('exportButton');
    const importFile = document.getElementById('importFile');
    const statusMessage = document.getElementById('statusMessage');

    // --- Tab Switching Logic (from settings.js) --- //
    mainTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            saveSettings(); // Save settings before switching tabs
            const mainTab = button.dataset.tab;
            mainTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            mainTabPanels.forEach(panel => {
                panel.classList.toggle('active', panel.id === `${mainTab}-tab-content`);
            });
        });
    });

    subTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const subTab = button.dataset.subTab;
            const parentNav = button.closest('.sub-tab-nav');
            const parentPanel = button.closest('.tab-panel');
            parentNav.querySelectorAll('.sub-header-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            parentPanel.querySelectorAll('.sub-tab-panel').forEach(panel => panel.classList.remove('active'));
            const panelToShow = document.getElementById(`${subTab}-sub-tab-content`);
            if (panelToShow) {
                panelToShow.classList.add('active');
            }
        });
    });

    // --- Settings Persistence (from settings.js) --- //
    const settings = {
        general: { darkMode: false },
        games: {
            anagram: { minLength: 3, maxLength: 8, timeLimit: 60, hintCount: 3 },
            crossword: { gridSize: 15, cellSize: 36, showNumbers: true, hintAllowance: 0, hoverHighlight: true },
            wordsearch: { gridSize: 12, cellSize: 36, allowDiagonals: true, allowBackwards: true, showWordList: true },
            falling: { speed: 3, maxWordLength: 6, lives: 3 },
            snake: { speed: 5, walls: true }
        }
    };
    const SETTINGS_STORAGE_KEY = 'wordGamesSettings';
    const inputs = document.querySelectorAll('input[type="checkbox"], input[type="number"], input[type="range"], select');

    function mergeSettings(target, source) {
        Object.keys(source || {}).forEach(key => {
            const srcVal = source[key];
            if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
                if (!target[key]) {
                    target[key] = {};
                }
                mergeSettings(target[key], srcVal);
            } else {
                target[key] = srcVal;
            }
        });
    }

    function applyLegacyUpgrades(source) {
        if (!source || typeof source !== 'object') {
            return;
        }
        const legacyAnagram = source?.games?.anagram;
        if (legacyAnagram) {
            if (!Number.isInteger(legacyAnagram.minLength) || !Number.isInteger(legacyAnagram.maxLength)) {
                switch (legacyAnagram.difficulty) {
                    case 'easy': legacyAnagram.minLength = 3; legacyAnagram.maxLength = 5; break;
                    case 'hard': legacyAnagram.minLength = 7; legacyAnagram.maxLength = 12; break;
                    default: legacyAnagram.minLength = 5; legacyAnagram.maxLength = 8; break;
                }
            }
            if (!Number.isInteger(legacyAnagram.hintCount) && typeof legacyAnagram.hints === 'boolean') {
                legacyAnagram.hintCount = legacyAnagram.hints ? 3 : 0;
            }
        }
        const legacyFalling = source?.games?.falling;
        if (legacyFalling) {
            if (!Number.isInteger(legacyFalling.maxWordLength) && Number.isInteger(legacyFalling.wordLength)) {
                legacyFalling.maxWordLength = legacyFalling.wordLength;
            }
        }
        const legacyCrossword = source?.games?.crossword;
        if (legacyCrossword) {
            if (!Number.isInteger(legacyCrossword.cellSize)) { legacyCrossword.cellSize = 36; }
            if (typeof legacyCrossword.showNumbers !== 'boolean') { legacyCrossword.showNumbers = true; }
            if (!Number.isInteger(legacyCrossword.hintAllowance)) { legacyCrossword.hintAllowance = 0; }
            if (typeof legacyCrossword.hoverHighlight !== 'boolean') { legacyCrossword.hoverHighlight = true; }
            if (legacyCrossword.theme) { delete legacyCrossword.theme; }
        }
        const legacyWordSearch = source?.games?.wordsearch;
        if (legacyWordSearch) {
            if (!Number.isInteger(legacyWordSearch.gridSize)) { legacyWordSearch.gridSize = 12; }
            if (!Number.isInteger(legacyWordSearch.cellSize)) { legacyWordSearch.cellSize = 36; }
            if (typeof legacyWordSearch.allowDiagonals !== 'boolean') { legacyWordSearch.allowDiagonals = true; }
            if (typeof legacyWordSearch.allowBackwards !== 'boolean') { legacyWordSearch.allowBackwards = true; }
            if (typeof legacyWordSearch.showWordList !== 'boolean') { legacyWordSearch.showWordList = true; }
        }
    }

    function getNumberValue(id, fallback, min, max) {
        const el = document.getElementById(id);
        if (!el) return fallback;
        let value = parseInt(el.value, 10);
        if (Number.isNaN(value)) { value = fallback; }
        if (typeof min === 'number') { value = Math.max(min, value); }
        if (typeof max === 'number') { value = Math.min(max, value); }
        el.value = value;
        return value;
    }

    function saveSettings() {
        const darkModeEl = document.getElementById('darkMode');
        settings.general.darkMode = darkModeEl ? darkModeEl.checked : false;
        let minLength = getNumberValue('anagramMinLength', settings.games.anagram.minLength, 3, 15);
        let maxLength = getNumberValue('anagramMaxLength', settings.games.anagram.maxLength, 3, 15);
        if (minLength > maxLength) { [minLength, maxLength] = [maxLength, minLength]; }
        settings.games.anagram.minLength = minLength;
        settings.games.anagram.maxLength = maxLength;
        document.getElementById('anagramMinLength').value = settings.games.anagram.minLength;
        document.getElementById('anagramMaxLength').value = settings.games.anagram.maxLength;
        settings.games.anagram.timeLimit = getNumberValue('anagramTimeLimit', settings.games.anagram.timeLimit, 0, 600);
        settings.games.anagram.hintCount = getNumberValue('anagramHints', settings.games.anagram.hintCount, 0, 10);
        settings.games.crossword.gridSize = getNumberValue('crosswordGridSize', settings.games.crossword.gridSize, 10, 25);
        settings.games.crossword.cellSize = getNumberValue('crosswordCellSize', settings.games.crossword.cellSize, 28, 48);
        const showNumbersEl = document.getElementById('crosswordShowNumbers');
        settings.games.crossword.showNumbers = showNumbersEl ? showNumbersEl.checked : settings.games.crossword.showNumbers;
        settings.games.crossword.hintAllowance = getNumberValue('crosswordHintAllowance', settings.games.crossword.hintAllowance, 0, 10);
        const hoverHighlightEl = document.getElementById('crosswordHoverHighlight');
        settings.games.crossword.hoverHighlight = hoverHighlightEl ? hoverHighlightEl.checked : settings.games.crossword.hoverHighlight;
        settings.games.falling.speed = getNumberValue('fallingSpeed', settings.games.falling.speed, 1, 10);
        settings.games.falling.maxWordLength = getNumberValue('fallingWordLength', settings.games.falling.maxWordLength, 3, 12);
        settings.games.falling.lives = getNumberValue('fallingLives', settings.games.falling.lives, 1, 9);
        settings.games.wordsearch.gridSize = getNumberValue('wordSearchGridSize', settings.games.wordsearch.gridSize, 8, 24);
        settings.games.wordsearch.cellSize = getNumberValue('wordSearchCellSize', settings.games.wordsearch.cellSize, 28, 48);
        const wordSearchDiagEl = document.getElementById('wordSearchDiagonals');
        settings.games.wordsearch.allowDiagonals = wordSearchDiagEl ? wordSearchDiagEl.checked : settings.games.wordsearch.allowDiagonals;
        const wordSearchBackEl = document.getElementById('wordSearchBackwards');
        settings.games.wordsearch.allowBackwards = wordSearchBackEl ? wordSearchBackEl.checked : settings.games.wordsearch.allowBackwards;
        const wordSearchShowListEl = document.getElementById('wordSearchShowList');
        settings.games.wordsearch.showWordList = wordSearchShowListEl ? wordSearchShowListEl.checked : settings.games.wordsearch.showWordList;
        settings.games.snake.speed = getNumberValue('snakeSpeed', settings.games.snake.speed, 1, 10);
        const wallsEl = document.getElementById('snakeWalls');
        settings.games.snake.walls = wallsEl ? wallsEl.checked : settings.games.snake.walls;
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        console.log('Settings saved:', settings);
    }

    function loadSettings() {
        const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (savedSettings) {
            try {
                const loaded = JSON.parse(savedSettings);
                applyLegacyUpgrades(loaded);
                mergeSettings(settings, loaded);
            } catch (error) {
                console.error('Error parsing settings, using defaults.', error);
            }
        }
        const darkModeEl = document.getElementById('darkMode');
        if (darkModeEl) { darkModeEl.checked = settings.general.darkMode; }
        document.getElementById('anagramMinLength').value = settings.games.anagram.minLength;
        document.getElementById('anagramMaxLength').value = settings.games.anagram.maxLength;
        document.getElementById('anagramTimeLimit').value = settings.games.anagram.timeLimit;
        document.getElementById('anagramHints').value = settings.games.anagram.hintCount;
        document.getElementById('crosswordGridSize').value = settings.games.crossword.gridSize;
        document.getElementById('crosswordCellSize').value = settings.games.crossword.cellSize;
        const showNumbersEl = document.getElementById('crosswordShowNumbers');
        if (showNumbersEl) { showNumbersEl.checked = settings.games.crossword.showNumbers; }
        document.getElementById('crosswordHintAllowance').value = settings.games.crossword.hintAllowance;
        const hoverHighlightEl = document.getElementById('crosswordHoverHighlight');
        if (hoverHighlightEl) { hoverHighlightEl.checked = settings.games.crossword.hoverHighlight; }
        document.getElementById('fallingSpeed').value = settings.games.falling.speed;
        document.getElementById('fallingWordLength').value = settings.games.falling.maxWordLength;
        document.getElementById('fallingLives').value = settings.games.falling.lives;
        document.getElementById('wordSearchGridSize').value = settings.games.wordsearch.gridSize;
        document.getElementById('wordSearchCellSize').value = settings.games.wordsearch.cellSize;
        const wordSearchDiagEl = document.getElementById('wordSearchDiagonals');
        if (wordSearchDiagEl) { wordSearchDiagEl.checked = settings.games.wordsearch.allowDiagonals; }
        const wordSearchBackEl = document.getElementById('wordSearchBackwards');
        if (wordSearchBackEl) { wordSearchBackEl.checked = settings.games.wordsearch.allowBackwards; }
        const wordSearchShowListEl = document.getElementById('wordSearchShowList');
        if (wordSearchShowListEl) { wordSearchShowListEl.checked = settings.games.wordsearch.showWordList; }
        document.getElementById('snakeSpeed').value = settings.games.snake.speed;
        const wallsEl = document.getElementById('snakeWalls');
        if (wallsEl) { wallsEl.checked = settings.games.snake.walls; }
        console.log('Settings loaded:', settings);
    }

    if(inputs.length > 0) {
        inputs.forEach(input => {
            input.addEventListener('change', saveSettings);
            if (input.type === 'range') {
                input.addEventListener('input', saveSettings);
            }
        });
        loadSettings();
    }


    // --- Vocabulary Management (from vocabulary.js) --- //
    const VOCAB_STORAGE_KEY = 'wordGameLists';
    const WORD_LIST_ENDPOINT = '/api/wordlists';

    function getLists() {
        try {
            const lists = localStorage.getItem(VOCAB_STORAGE_KEY);
            return lists ? JSON.parse(lists) : {};
        } catch (error) {
            console.error('Could not parse stored word lists.', error);
            return {};
        }
    }

    function saveListsLocally(lists) {
        localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(lists));
    }

    function persistListsToServer(lists) {
        return fetch(WORD_LIST_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lists || {})
        }).then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || 'Failed to persist word lists.');
                });
            }
        });
    }

    function saveLists(lists) {
        saveListsLocally(lists);
        persistListsToServer(lists).catch(error => {
            console.warn('Unable to update the shared word list file.', error);
            showStatus('Saved locally, but the shared word list file could not be updated.', true);
        });
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
            console.warn('Unable to sync word lists from the server.', error);
        }
    }

    function parseWords(raw) {

        return raw.replace(/,/g, '\n').split('\n').map(word => word.trim()).filter(Boolean);
    }

    function showStatus(message, isError = false) {
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.style.color = isError ? 'red' : 'green';
            setTimeout(() => {
                statusMessage.textContent = '';
            }, 3000);
        }
    }

    function clearEditor() {
        if (listNameInput) listNameInput.value = '';
        if (wordInput) wordInput.value = '';
    }

    function clearNewForm() {
        if (newListNameInput) newListNameInput.value = '';
        if (newWordInput) newWordInput.value = '';
    }

    function updateListSelector(selectedName) {
        if (!listSelector) return;
        const lists = getLists();
        const previous = selectedName ?? listSelector.value;
        listSelector.innerHTML = '';
        const listNames = Object.keys(lists).sort();
        if (listNames.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No lists found';
            option.disabled = true;
            listSelector.appendChild(option);
            return;
        }
        listNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            listSelector.appendChild(option);
        });
        const toSelect = listNames.includes(previous) ? previous : listNames[0];
        listSelector.value = toSelect;
    }

    function persistList(name, words) {
        if (!name || words.length === 0) {
            showStatus('List name and at least one word are required.', true);
            return false;
        }
        const lists = getLists();
        lists[name] = words;
        saveLists(lists);
        updateListSelector(name);
        showStatus(`List '${name}' saved successfully.`);
        return true;
    }

    if (saveNewButton) {
        saveNewButton.addEventListener('click', () => {
            const listName = newListNameInput.value.trim();
            const words = parseWords(newWordInput.value.trim());
            if (!persistList(listName, words)) {
                return;
            }
            if (listNameInput) listNameInput.value = listName;
            if (wordInput) wordInput.value = words.join('\n');
            clearNewForm();
        });
    }

    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const listName = listNameInput.value.trim();
            const words = parseWords(wordInput.value.trim());
            if (persistList(listName, words)) {
                clearEditor();
            }
        });
    }

    if (loadButton) {
        loadButton.addEventListener('click', () => {
            if (!listSelector || !listSelector.options[listSelector.selectedIndex]) {
                showStatus('Please select a valid list to load.', true);
                return;
            }
            const listName = listSelector.value;
            if (!listName || listSelector.options[listSelector.selectedIndex].disabled) {
                showStatus('Please select a valid list to load.', true);
                return;
            }
            const lists = getLists();
            const words = lists[listName];
            if (listNameInput) listNameInput.value = listName;
            if (wordInput) wordInput.value = (words || []).join('\n');
            showStatus(`List '${listName}' loaded into editor.`);
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (!listSelector || !listSelector.options[listSelector.selectedIndex]) {
                showStatus('Please select a valid list to delete.', true);
                return;
            }
            const listName = listSelector.value;
            if (!listName || listSelector.options[listSelector.selectedIndex].disabled) {
                showStatus('Please select a valid list to delete.', true);
                return;
            }
            if (confirm(`Are you sure you want to delete the list '${listName}'?`)) {
                const lists = getLists();
                delete lists[listName];
                saveLists(lists);
                updateListSelector();
                clearEditor();
                showStatus(`List '${listName}' deleted.`);
            }
        });
    }

    if (exportButton) {
        exportButton.addEventListener('click', () => {
            const lists = getLists();
            if (Object.keys(lists).length === 0) {
                showStatus('No lists to export.', true);
                return;
            }
            const dataStr = JSON.stringify(lists, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'wordlists.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showStatus('All lists exported to wordlists.json.');
        });
    }

    if (importFile) {
        importFile.addEventListener('change', () => {
            const file = importFile.files[0];
            if (!file) {
                return; // No file selected, do nothing.
            }
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const importedLists = JSON.parse(event.target.result);
                    if (typeof importedLists !== 'object' || importedLists === null || Array.isArray(importedLists)) {
                        throw new Error('Invalid JSON format: file must contain an object of key-value pairs (list name and word array).');
                    }
                    const currentLists = getLists();
                    let importCount = 0;
                    for (const listName in importedLists) {
                        if (Object.hasOwnProperty.call(importedLists, listName)) {
                            const words = importedLists[listName];
                            if (Array.isArray(words) && words.every(w => typeof w === 'string')) {
                                currentLists[listName] = words.map(w => w.trim()).filter(Boolean);
                                importCount++;
                            }
                        }
                    }
                    if (importCount > 0) {
                        saveLists(currentLists);
                        updateListSelector();
                        showStatus(`${importCount} list(s) imported and merged successfully.`);
                    } else {
                        throw new Error('No valid lists found in the imported file.');
                    }
                } catch (error) {
                    showStatus(`Error importing file: ${error.message}`, true);
                } finally {
                    importFile.value = '';
                }
            };
            reader.onerror = () => {
                showStatus('Error reading file.', true);
            };
            reader.readAsText(file);
        });
    }

    // Initial load
    updateListSelector();
    syncListsFromServer().then(updateListSelector);
});