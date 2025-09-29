export function generateCrossword(words, size) {
	const GRID = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
	const normalized = Array.from(new Set(
		words.map(w => w.replace(/[^A-Za-z]/g, '').toUpperCase()).filter(Boolean)
	)).sort((a, b) => b.length - a.length);
	const placements = [];
	const inB = (x, y) => x >= 0 && y >= 0 && x < size && y < size;
	const cell = (x, y) => GRID[y][x];

	function canPlace(word, x, y, dir) {
		const dx = dir === 'across' ? 1 : 0, dy = dir === 'down' ? 0 : 1;
		const len = word.length, endx = x + dx * (len - 1), endy = y + dy * (len - 1);
		if (!inB(x, y) || !inB(endx, endy)) return false;
		for (let i = 0; i < len; i++) {
			const nx = x + dx * i, ny = y + dy * i, c = cell(nx, ny);
			if (c && c !== word[i]) return false;
			if (i === 0) {
				const bx = x - dx, by = y - dy;
				if (inB(bx, by) && cell(bx, by)) return false;
			}
			if (i === len - 1) {
				const ax = endx + dx, ay = endy + dy;
				if (inB(ax, ay) && cell(ax, ay)) return false;
			}
			if (dir === 'across') {
				if (inB(x + dx * i, y - 1) && cell(x + dx * i, y - 1) && !c) return false;
				if (inB(x + dx * i, y + 1) && cell(x + dx * i, y + 1) && !c) return false;
			} else {
				if (inB(x - 1, y + dy * i) && cell(x - 1, y + dy * i) && !c) return false;
				if (inB(x + 1, y + dy * i) && cell(x + 1, y + dy * i) && !c) return false;
			}
		}
		return true;
	}

	function place(word, x, y, dir) {
		const dx = dir === 'across' ? 1 : 0, dy = dir === 'down' ? 0 : 1;
		const cells = [];
		for (let i = 0; i < word.length; i++) {
			const nx = x + dx * i, ny = y + dy * i;
			if (!inB(nx, ny)) continue; // Defensive: skip if out of bounds
			GRID[ny][nx] = word[i];
			cells.push([nx, ny]);
		}
		placements.push({ word, x, y, dir, cells });
	}

	// Only use words that fit in the grid
	const filtered = normalized.filter(w => w.length <= size);
	if (filtered.length) {
		const startX = Math.max(0, Math.floor((size - filtered[0].length) / 2)), startY = Math.floor(size / 2);
		place(filtered[0], startX, startY, 'across');
	}
	for (let wi = 1; wi < filtered.length; wi++) {
		const w = filtered[wi];
		let placed = false;
		outer: for (const p of placements) {
			for (let i = 0; i < p.word.length; i++) {
				for (let j = 0; j < w.length; j++) {
					if (p.word[i] !== w[j]) continue;
					const ix = p.x + (p.dir === 'across' ? i : 0), iy = p.y + (p.dir === 'down' ? i : 0);
					const dir = p.dir === 'across' ? 'down' : 'across';
					const x = ix - (dir === 'across' ? j : 0), y = iy - (dir === 'down' ? j : 0);
					if (canPlace(w, x, y, dir)) {
						place(w, x, y, dir); placed = true; break outer;
					}
				}
			}
		}
		if (!placed) {
			for (const dir of ['across', 'down']) {
				for (let y = 0; y < size; y++) {
					for (let x = 0; x < size; x++) {
						if (canPlace(w, x, y, dir)) {
							place(w, x, y, dir); placed = true; break;
						}
					}
					if (placed) break;
				}
				if (placed) break;
			}
		}
	}
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			if (GRID[y][x] === null) GRID[y][x] = '#';
		}
	}
	const numbers = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
	let next = 1;
	const isStart = (x, y) =>
		GRID[y][x] !== '#' &&
		((x === 0 || GRID[y][x - 1] === '#') && x + 1 < size && GRID[y][x + 1] !== '#'
			|| (y === 0 || GRID[y - 1][x] === '#') && y + 1 < size && GRID[y + 1][x] !== '#');
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			if (isStart(x, y)) numbers[y][x] = next++;
		}
	}
	return { grid: GRID, placements, numbers };
}
