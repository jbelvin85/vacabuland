# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project structure initiated by the.NEXUS.
- `docs` directory for all project documentation.
- `docs/ROADMAP.md` outlining the future development path.
- `docs/CHANGELOG.md` to track all notable changes.
- `README.md` for a general project overview.

### Fixed

- **Games:** Corrected a race condition in the Wordsearch, Crossword, and Falling Words games that prevented them from loading properly. The legacy configuration handling in each game's HTML file was removed and replaced with a standardized loading guard that waits for the central `app.js` module to bootstrap the word list configuration.
