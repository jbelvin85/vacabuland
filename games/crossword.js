
export function generateCrossword(words, size) {
	// Normalize and filter words
	const normalized = Array.from(new Set(words.map(w => w.replace(/[^A-Za-z]/g, '').toUpperCase()).filter(Boolean)));
	const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
	const placements = [];
	const inBounds = (x, y) => x >= 0 && y >= 0 && x < size && y < size;

	// Try to place each word horizontally, then vertically, in the first available spot
	for (const word of normalized) {
		let placed = false;
		// Try horizontal
		for (let y = 0; y < size && !placed; y++) {
			for (let x = 0; x <= size - word.length && !placed; x++) {
				let canPlace = true;
				for (let i = 0; i < word.length; i++) {
					if (grid[y][x + i] && grid[y][x + i] !== word[i]) {
						canPlace = false;
						break;
					}
				}
				if (canPlace) {
					const cells = [];
					for (let i = 0; i < word.length; i++) {
						grid[y][x + i] = word[i];
						cells.push([x + i, y]);
					}
					placements.push({ word, x, y, dir: 'across', direction: 'across', cells, clue: word });
					placed = true;
				}
			}
		}
		// Try vertical
		if (!placed) {
			for (let x = 0; x < size && !placed; x++) {
				for (let y = 0; y <= size - word.length && !placed; y++) {
					let canPlace = true;
					for (let i = 0; i < word.length; i++) {
						if (grid[y + i][x] && grid[y + i][x] !== word[i]) {
							canPlace = false;
							break;
						}
					}
					if (canPlace) {
						const cells = [];
						for (let i = 0; i < word.length; i++) {
							grid[y + i][x] = word[i];
							cells.push([x, y + i]);
						}
						placements.push({ word, x, y, dir: 'down', direction: 'down', cells, clue: word });
						placed = true;
					}
				}
			}
		}
		// If not placed, skip the word
	}

	// Fill unused cells with '#'
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			if (!grid[y][x]) grid[y][x] = '#';
		}
	}

	// Numbering
	const numbers = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
	let next = 1;
	const isStart = (x, y) => {
		if (grid[y][x] === '#') return false;
		// Start of across
		if ((x === 0 || grid[y][x - 1] === '#') && x + 1 < size && grid[y][x + 1] !== '#') return true;
		// Start of down
		if ((y === 0 || grid[y - 1][x] === '#') && y + 1 < size && grid[y + 1][x] !== '#') return true;
		return false;
	};
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			if (isStart(x, y)) numbers[y][x] = next++;
		}
	}
	// Assign numbers to placements
	for (const p of placements) {
		if (p.cells && p.cells.length > 0) {
			const [nx, ny] = p.cells[0];
			if (numbers[ny] && numbers[ny][nx]) {
				p.number = numbers[ny][nx];
			}
		}
	}
	return { grid, placements, numbers };
}
