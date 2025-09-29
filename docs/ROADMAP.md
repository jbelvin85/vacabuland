# Project Roadmap

## Phase 1: Core Logic and Game Integration (Complete)

- [x] **Create Core Logic Module (`app.js`):** Implement the central module in `games/app.js` to provide shared functionality to all games.
- [x] **Implement Word Loading (`loadConfig`):** Develop a function to asynchronously fetch `sample-words.json` and make it available to all games via session storage.
- [x] **Implement Utility Functions:** Create and export `normalizeWord`, `shuffle`, and `randLetter` to support game mechanics.
- [x] **Integrate Games with Core Logic:** Ensure all five game files (`anagram.js`, `crossword.js`, `falling.html`, `wordsearch.html`, `snake.html`) correctly import and utilize the new `app.js` module.

## Phase 2: Game Validation and Refinement

- [x] **Validate Anagram Game:** Confirmed scoring, timer, shuffle, and hint flows while tidying the UI text so timer and totals surface clearly in the toolbar.
- [x] **Validate Crossword Game:** Fixed missing toolbar controls and guarded solution toggling so grid rendering, hint allowance, and print/export actions all behave with saved settings.
- [x] **Validate Falling Words Game:** Exercised lives, speed progression, and max-word-length constraints; normalized the interface text and ensured overlay handling when runs end.
- [x] **Validate Word Search Game:** Added tracking for found words, word-list strikeouts, and completion banner; ensured settings drive grid generation and solution toggling without errors.
- [x] **Validate Word Snake Game:** Verified wall setting, wrap logic, scoring, and word progression while replacing corrupted labels with clear status badges.

## Phase 3: Vocabulary and Word Management

- [ ] **Vocabulary Builder:** Allow users to view and manage their own vocabulary list.
- [ ] **Custom Word Lists:** Enable users to create and use their own word lists for games.
- [ ] **API Integration:** Fetch words from an external dictionary API.

## Phase 4: Next-Generation Features

- [ ] **User Accounts:** Allow users to create accounts to save progress and settings across devices.
- [ ] **Multiplayer:** Introduce real-time multiplayer modes for select games.
- [ ] **Accessibility:** Implement features for users with disabilities (e.g., high-contrast mode, screen reader support).
