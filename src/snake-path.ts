import { isAdjacent, pointKey, type Point } from "./domain.js";
import type { ContributionGrid } from "./contribution-grid.js";

const DEFAULT_SEED = 1;
const ROUTE_VARIANT_COUNT = 3;

export function planSnakePath(grid: ContributionGrid, seed = DEFAULT_SEED): readonly Point[] {
  if (grid.columns < 1 || grid.rows < 1) {
    return [];
  }

  if (!Number.isInteger(seed)) {
    throw new Error("Snake path seed must be an integer.");
  }

  const routeVariant = (seed >>> 0) % ROUTE_VARIANT_COUNT;
  const path = buildRouteVariant(grid.columns, grid.rows, routeVariant);

  validatePath(path, grid.columns, grid.rows);
  return path;
}

function buildRouteVariant(columns: number, rows: number, variant: number): Point[] {
  if (variant === 1) {
    return buildColumnSnake(columns, rows);
  }

  if (variant === 2) {
    return buildSpiral(columns, rows);
  }

  return buildRowSnake(columns, rows);
}

function buildRowSnake(columns: number, rows: number): Point[] {
  const path: Point[] = [];

  for (let y = 0; y < rows; y += 1) {
    if (y % 2 === 0) {
      for (let x = 0; x < columns; x += 1) {
        path.push({ x, y });
      }
    } else {
      for (let x = columns - 1; x >= 0; x -= 1) {
        path.push({ x, y });
      }
    }
  }

  return path;
}

function buildColumnSnake(columns: number, rows: number): Point[] {
  const path: Point[] = [];

  for (let x = 0; x < columns; x += 1) {
    if (x % 2 === 0) {
      for (let y = 0; y < rows; y += 1) {
        path.push({ x, y });
      }
    } else {
      for (let y = rows - 1; y >= 0; y -= 1) {
        path.push({ x, y });
      }
    }
  }

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

  if (path.length !== expectedLength) {
    throw new Error("Snake path does not cover the complete grid.");
  }

  const seen = new Set<string>();

  path.forEach((point, index) => {
    if (point.x < 0 || point.x >= columns || point.y < 0 || point.y >= rows) {
      throw new Error("Snake path contains an out-of-grid point.");
    }

    const key = pointKey(point);

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
