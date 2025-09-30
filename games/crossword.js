

export function generateCrossword(words, size) {
	// Normalize and filter words
	const normalized = Array.from(new Set(words.map(w => w.replace(/[^A-Za-z]/g, '').toUpperCase()).filter(Boolean)));
	const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
	const placements = [];
	const inBounds = (x, y) => x >= 0 && y >= 0 && x < size && y < size;

	// Place the first word in the center horizontally
	if (normalized.length) {
		const word = normalized[0];
		const x = Math.floor((size - word.length) / 2);
		const y = Math.floor(size / 2);
		const cells = [];
		for (let i = 0; i < word.length; i++) {
			grid[y][x + i] = word[i];
			cells.push([x + i, y]);
		}
		placements.push({ word, x, y, dir: 'across', direction: 'across', cells, clue: word });
	}

	// Try to cross each subsequent word with existing words
	for (let wi = 1; wi < normalized.length; wi++) {
		const word = normalized[wi];
		let best = null;
		// Try to cross with any placed word at any shared letter
		for (const placed of placements) {
			for (let i = 0; i < placed.word.length; i++) {
				for (let j = 0; j < word.length; j++) {
					if (placed.word[i] !== word[j]) continue;
					// Try to place word crossing at (px, py)
					let x, y, dir;
					if (placed.dir === 'across') {
						dir = 'down';
						x = placed.x + i;
						y = placed.y - j;
					} else {
						dir = 'across';
						x = placed.x - j;
						y = placed.y + i;
					}
					// Check bounds and conflicts
					let canPlace = true;
					const cells = [];
					for (let k = 0; k < word.length; k++) {
						const cx = dir === 'across' ? x + k : x;
						const cy = dir === 'across' ? y : y + k;
						if (!inBounds(cx, cy)) { canPlace = false; break; }
						const g = grid[cy][cx];
						if (g && g !== word[k]) { canPlace = false; break; }
						// Don't allow parallel words to touch
						if (dir === 'across') {
							if ((inBounds(cx, cy - 1) && grid[cy - 1][cx]) || (inBounds(cx, cy + 1) && grid[cy + 1][cx])) {
								if (!g) { canPlace = false; break; }
							}
						} else {
							if ((inBounds(cx - 1, cy) && grid[cy][cx - 1]) || (inBounds(cx + 1, cy) && grid[cy][cx + 1])) {
								if (!g) { canPlace = false; break; }
							}
						}
						cells.push([cx, cy]);
					}
					// Check cells before and after for touching
					if (canPlace) {
						const beforeX = dir === 'across' ? x - 1 : x;
						const beforeY = dir === 'across' ? y : y - 1;
						const afterX = dir === 'across' ? x + word.length : x;
						const afterY = dir === 'across' ? y : y + word.length;
						if ((inBounds(beforeX, beforeY) && grid[beforeY][beforeX]) ||
								(inBounds(afterX, afterY) && grid[afterY][afterX])) {
							canPlace = false;
						}
					}
					if (canPlace) {
						best = { word, x, y, dir, direction: dir, cells, clue: word };
						break;
					}
				}
				if (best) break;
			}
			if (best) break;
		}
		// If no crossing possible, try to place in first available row/col
		if (!best) {
			// Try all rows (across)
			outer: for (let y = 0; y < size; y++) {
				for (let x = 0; x <= size - word.length; x++) {
					let canPlace = true;
					const cells = [];
					for (let k = 0; k < word.length; k++) {
						if (grid[y][x + k]) { canPlace = false; break; }
						// Don't allow touching above/below
						if ((inBounds(x + k, y - 1) && grid[y - 1][x + k]) || (inBounds(x + k, y + 1) && grid[y + 1][x + k])) {
							canPlace = false; break;
						}
						cells.push([x + k, y]);
					}
					// Check before/after
					if (canPlace) {
						if ((inBounds(x - 1, y) && grid[y][x - 1]) || (inBounds(x + word.length, y) && grid[y][x + word.length])) {
							canPlace = false;
						}
					}
					if (canPlace) {
						best = { word, x, y, dir: 'across', direction: 'across', cells, clue: word };
						break outer;
					}
				}
			}
			// Try all columns (down)
			if (!best) {
				outer: for (let x = 0; x < size; x++) {
					for (let y = 0; y <= size - word.length; y++) {
						let canPlace = true;
						const cells = [];
						for (let k = 0; k < word.length; k++) {
							if (grid[y + k][x]) { canPlace = false; break; }
							// Don't allow touching left/right
							if ((inBounds(x - 1, y + k) && grid[y + k][x - 1]) || (inBounds(x + 1, y + k) && grid[y + k][x + 1])) {
								canPlace = false; break;
							}
							cells.push([x, y + k]);
						}
						// Check before/after
						if (canPlace) {
							if ((inBounds(x, y - 1) && grid[y - 1][x]) || (inBounds(x, y + word.length) && grid[y + word.length][x])) {
								canPlace = false;
							}
						}
						if (canPlace) {
							best = { word, x, y, dir: 'down', direction: 'down', cells, clue: word };
							break outer;
						}
					}
				}
			}
		}
		// Place the word if possible
		if (best) {
			for (const [cx, cy] of best.cells) {
				grid[cy][cx] = word[best.dir === 'across' ? cx - best.x : cy - best.y];
			}
			placements.push(best);
		}
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
