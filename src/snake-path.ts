import { isAdjacent, pointKey, type Point } from "./domain.js";
import type { ContributionGrid } from "./contribution-grid.js";

const DEFAULT_SEED = 1;
export function planSnakePath(grid: ContributionGrid, seed = DEFAULT_SEED): readonly Point[] {
  if (grid.columns < 1 || grid.rows < 1) {
    return [];
  }

  if (!Number.isInteger(seed)) {
    throw new Error("Snake path seed must be an integer.");
  }

  const path = buildJitteredRowSnake(grid.columns, grid.rows, seed);

  validatePath(path, grid.columns, grid.rows);
  return path;
}

function buildSpiral(columns: number, rows: number): Point[] {
  const path: Point[] = [];
  let left = 0;
  let right = columns - 1;
  let top = 0;
  let bottom = rows - 1;

  while (left <= right && top <= bottom) {
    for (let x = left; x <= right; x += 1) {
      path.push({ x, y: top });
    }
    top += 1;

    for (let y = top; y <= bottom; y += 1) {
      path.push({ x: right, y });
    }
    right -= 1;

    if (top <= bottom) {
      for (let x = right; x >= left; x -= 1) {
        path.push({ x, y: bottom });
      }
      bottom -= 1;
    }

    if (left <= right) {
      for (let y = bottom; y >= top; y -= 1) {
        path.push({ x: left, y });
      }
      left += 1;
    }
  }

  return path;
}

function validatePath(path: readonly Point[], columns: number, rows: number): void {
  const expectedLength = columns * rows;

  if (path.length < expectedLength) {
    throw new Error("Snake path does not cover the complete grid.");
  }

  const seen = new Set<string>();

  path.forEach((point, index) => {
    if (point.x < 0 || point.x >= columns || point.y < 0 || point.y >= rows) {
      throw new Error("Snake path contains an out-of-grid point.");
    }

    const key = pointKey(point);
    seen.add(key);

    const previous = path[index - 1];

    if (previous && !isAdjacent(previous, point)) {
      throw new Error("Snake path contains a non-adjacent move.");
    }
  });

  if (seen.size !== expectedLength) {
    throw new Error("Snake path does not visit every grid coordinate.");
  }
}
