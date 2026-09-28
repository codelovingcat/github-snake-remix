import { isAdjacent, pointKey, type Point } from "./domain.js";
import type { ContributionGrid } from "./contribution-grid.js";

const DEFAULT_SEED = 1;

export function planSnakePath(grid: ContributionGrid, seed = DEFAULT_SEED): readonly Point[] {
  if (grid.columns < 1 || grid.rows < 1) {
    return [];
  }

  const random = createSeededRandom(seed);
  const totalCells = grid.columns * grid.rows;
  const start = {
    x: Math.floor(random() * grid.columns),
    y: Math.floor(random() * grid.rows)
  };

  const path: Point[] = [start];
  const visited = new Set<string>([pointKey(start)]);

  if (!walkPath(start, path, visited, grid.columns, grid.rows, random, totalCells)) {
    throw new Error("Snake path generation failed: unable to cover the entire grid.");
  }

  validatePath(path, grid.columns, grid.rows);
  return path;
}

function walkPath(
  current: Point,
  path: Point[],
  visited: Set<string>,
  columns: number,
  rows: number,
  random: () => number,
  totalCells: number
): boolean {
  if (path.length === totalCells) {
    return true;
  }

  const candidates = getUnvisitedNeighbors(current, visited, columns, rows)
    .map((point) => ({
      point,
      onwardMoves: countUnvisitedNeighbors(point, visited, columns, rows),
      jitter: random()
    }))
    .sort((a, b) => a.onwardMoves - b.onwardMoves || a.jitter - b.jitter);

  for (const candidate of candidates) {
    const key = pointKey(candidate.point);
    visited.add(key);
    path.push(candidate.point);

    if (!createsDeadEnd(candidate.point, visited, columns, rows, totalCells)) {
      if (walkPath(candidate.point, path, visited, columns, rows, random, totalCells)) {
        return true;
      }
    }

    path.pop();
    visited.delete(key);
  }

  return false;
}

function createsDeadEnd(
  current: Point,
  visited: Set<string>,
  columns: number,
  rows: number,
  totalCells: number
): boolean {
  if (visited.size === totalCells) {
    return false;
  }

  const unvisited = totalCells - visited.size;

  // The remaining unvisited cells must stay connected to the current head.
  const reachable = new Set<string>([pointKey(current)]);
  const queue: Point[] = [current];

  while (queue.length > 0) {
    const point = queue.pop();
    if (!point) continue;

    for (const neighbor of getAllNeighbors(point, columns, rows)) {
      const key = pointKey(neighbor);
      if (neighbor.x === current.x && neighbor.y === current.y) {
        continue;
      }

      if (!visited.has(key) || key === pointKey(current)) {
        if (!reachable.has(key)) {
          reachable.add(key);
          queue.push(neighbor);
        }
      }
    }
  }

  if (reachable.size !== unvisited + 1) {
    return true;
  }

  // More than one isolated degree-1 cell means the remaining path cannot
  // be completed from the current head without revisiting a cell.
  let deadEnds = 0;

  for (let x = 0; x < columns; x += 1) {
    for (let y = 0; y < rows; y += 1) {
      const key = `${x}:${y}`;
      if (visited.has(key)) continue;

      const degree = getAllNeighbors({ x, y }, columns, rows)
        .filter((neighbor) => !visited.has(pointKey(neighbor)) || pointKey(neighbor) === pointKey(current))
        .length;

      if (degree === 0) {
        return true;
      }

      if (degree === 1) {
        deadEnds += 1;
        if (deadEnds > 1) {
          return true;
        }
      }
    }
  }

  return false;
}

function getUnvisitedNeighbors(
  current: Point,
  visited: Set<string>,
  columns: number,
  rows: number
): Point[] {
  return getAllNeighbors(current, columns, rows)
    .filter((point) => !visited.has(pointKey(point)));
}

function getAllNeighbors(current: Point, columns: number, rows: number): Point[] {
  const neighbors: Point[] = [];

  for (const direction of [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
  ]) {
    const next = { x: current.x + direction.x, y: current.y + direction.y };

    if (next.x >= 0 && next.x < columns && next.y >= 0 && next.y < rows) {
      neighbors.push(next);
    }
  }

  return neighbors;
}

function countUnvisitedNeighbors(
  point: Point,
  visited: Set<string>,
  columns: number,
  rows: number
): number {
  return getUnvisitedNeighbors(point, visited, columns, rows).length;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
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
