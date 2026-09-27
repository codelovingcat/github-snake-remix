import { isAdjacent, type Point } from "./domain.js";
import type { ContributionGrid } from "./contribution-grid.js";

export function planSnakePath(grid: ContributionGrid): readonly Point[] {
  if (grid.columns < 1 || grid.rows < 1) {
    return [];
  }

  const path: Point[] = [];

  for (let x = 0; x < grid.columns; x += 1) {
    if (x % 2 === 0) {
      for (let y = 0; y < grid.rows; y += 1) {
        path.push({ x, y });
      }
    } else {
      for (let y = grid.rows - 1; y >= 0; y -= 1) {
        path.push({ x, y });
      }
    }
  }

  validatePath(path, grid.columns, grid.rows);
  return path;
}

function validatePath(path: readonly Point[], columns: number, rows: number): void {
  const expectedLength = columns * rows;
  if (path.length !== expectedLength) {
    throw new Error("Snake path does not cover the complete grid.");
  }

  const seen = new Set<string>();

  path.forEach((point, index) => {
    if (point.x < 0 || point.x >= columns || point.y < 0 || point.y >= rows) {
      throw new Error("Snake path contains an out-of-grid point.");
    }

    const key = `${point.x}:${point.y}`;
    if (seen.has(key)) {
      throw new Error("Snake path contains a duplicate point.");
    }
    seen.add(key);

    const previous = path[index - 1];
    if (previous && !isAdjacent(previous, point)) {
      throw new Error("Snake path contains a non-adjacent move.");
    }
  });
}
