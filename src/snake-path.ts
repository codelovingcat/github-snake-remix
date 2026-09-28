import { isAdjacent, pointKey, type Point } from "./domain.js";
import type { ContributionGrid } from "./contribution-grid.js";

export function planSnakePath(grid: ContributionGrid, seed?: number): readonly Point[] {
  if (grid.columns < 1 || grid.rows < 1) {
    return [];
  }

  const random = createSeededRandom(seed ?? Date.now() + Math.floor(Math.random() * 1_000_000));
  const path: Point[] = [];
  const visited = new Set<string>();
  const visitCounts = new Map<string, number>();

  const start = {
    x: Math.floor(random() * grid.columns),
    y: Math.floor(random() * grid.rows)
  };

  path.push(start);
  visited.add(pointKey(start));
  visitCounts.set(pointKey(start), 1);

  if (!walkPath(start, null, path, visited, visitCounts, grid, random)) {
    throw new Error("Snake path generation failed: unable to cover the entire grid.");
  }

  validatePath(path, grid.columns, grid.rows);
  return path;
}

function walkPath(
  current: Point,
  previous: Point | null,
  path: Point[],
  visited: Set<string>,
  visitCounts: Map<string, number>,
  grid: ContributionGrid,
  random: () => number
): boolean {
  if (path.length === grid.columns * grid.rows) {
    return true;
  }

  const neighbors = getValidNeighbors(current, previous, grid.columns, grid.rows)
    .map((neighbor) => ({
      point: neighbor,
      score: scoreNeighbor(neighbor, current, previous, visited, visitCounts, random)
    }))
    .sort((a, b) => a.score - b.score);

  if (neighbors.length === 0) {
    return false;
  }

  for (const candidate of neighbors) {
    const key = pointKey(candidate.point);
    visited.add(key);
    visitCounts.set(key, (visitCounts.get(key) ?? 0) + 1);
    path.push(candidate.point);

    if (walkPath(candidate.point, current, path, visited, visitCounts, grid, random)) {
      return true;
    }

    path.pop();
    visited.delete(key);
    const count = visitCounts.get(key) ?? 1;
    if (count <= 1) {
      visitCounts.delete(key);
    } else {
      visitCounts.set(key, count - 1);
    }
  }

  return false;
}

function getValidNeighbors(
  current: Point,
  previous: Point | null,
  columns: number,
  rows: number
): Point[] {
  const neighbors: Point[] = [];

  for (const direction of [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
  ]) {
    const next = { x: current.x + direction.x, y: current.y + direction.y };

    if (next.x < 0 || next.x >= columns || next.y < 0 || next.y >= rows) {
      continue;
    }

    if (previous && next.x === previous.x && next.y === previous.y) {
      continue;
    }

    neighbors.push(next);
  }

  return neighbors;
}

function scoreNeighbor(
  next: Point,
  current: Point,
  previous: Point | null,
  visited: Set<string>,
  visitCounts: Map<string, number>,
  random: () => number
): number {
  const key = pointKey(next);
  if (visited.has(key)) {
    return Number.POSITIVE_INFINITY;
  }

  const visitPenalty = (visitCounts.get(key) ?? 0) * 3;
  const directionPenalty = previous
    ? ((next.x - current.x) === (current.x - previous.x) && (next.y - current.y) === (current.y - previous.y)) ? 2 : 0
    : 0;
  const sameRowPenalty = previous && current.y === previous.y && next.y === current.y ? 1.5 : 0;
  const explorationBonus = Math.abs(next.x - (current.x + (previous ? previous.x - current.x : 0)))
    + Math.abs(next.y - (current.y + (previous ? previous.y - current.y : 0)));

  return visitPenalty + directionPenalty + sameRowPenalty + explorationBonus + random() * 0.75;
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
