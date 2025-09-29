# Word Games Collection

A collection of interactive word games designed to challenge and expand your vocabulary.

## Games

*   **Anagram:** Unscramble the letters to form a word.
*   **Crossword:** Fill in the grid with words based on clues.
*   **Falling Words:** Type the falling words before they reach the bottom.
*   **Word Snake:** Guide the snake to eat letters and form words.

## Development

This project is a collaborative effort, with different aspects of development handled by specialized personas. See the `helpers` directory for more information.

### Getting Started

1.  Clone the repository.
2.  Open `index.html` in your browser to see the main menu.
3.  Select a game to play.

## Roadmap

See the full project roadmap in [docs/ROADMAP.md](docs/ROADMAP.md).
### Rust Launcher

To ship a lightweight Windows launcher without Electron:

1. Install the Rust toolchain from https://rustup.rs/ (requires Cargo in your PATH).
2. From the repo root, build the launcher with:
   - `cargo build --release --manifest-path launcher/Cargo.toml`
3. The executable will be created at `launcher/target/release/launcher.exe`.
4. Distribute that executable alongside the project files (or run it in-place). When launched it will start a local web server on `127.0.0.1` using a free port and open the default browser to the game menu.
5. Close the console window or press `Ctrl+C` to stop the server when you are done playing.
