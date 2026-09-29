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

function buildJitteredRowSnake(columns: number, rows: number, seed: number): Point[] {
  const basePath = buildRowSnake(columns, rows);

  if (columns < 2 || rows < 2) {
    return basePath;
  }

  const random = createSeededRandom(seed);
  const path: Point[] = [];
  let baseIndex = 0;
  let horizontalRun = 0;
  let nextDetourAfter = 5 + Math.floor(random() * 6);

  const first = basePath[0];
  if (!first) {
    return path;
  }

  path.push(first);

  while (baseIndex < basePath.length - 1) {
    const current = basePath[baseIndex];
    const next = basePath[baseIndex + 1];

    if (!current || !next) {
      break;
    }

    const horizontal = current.y === next.y && current.x !== next.x;

    if (horizontal) {
      horizontalRun += 1;

      if (horizontalRun >= nextDetourAfter) {
        const direction = next.x > current.x ? 1 : -1;
        const maxSpan = direction > 0
          ? columns - 1 - current.x
          : current.x;

        const verticalCandidates = [-1, 1]
          .flatMap((verticalDirection) =>
            [2, 1]
              .filter((depth) => {
                const targetY = current.y + verticalDirection * depth;
                return targetY >= 0 && targetY < rows;
              })
              .map((depth) => ({ verticalDirection, depth }))
          );

        const detour = verticalCandidates[Math.floor(random() * verticalCandidates.length)];

        if (detour && maxSpan >= 3) {
          const span = Math.min(4 + Math.floor(random() * 5), maxSpan);
          const targetY = current.y + detour.verticalDirection * detour.depth;
          const targetX = current.x + direction * span;

          for (let step = 1; step <= detour.depth; step += 1) {
            path.push({
              x: current.x,
              y: current.y + detour.verticalDirection * step
            });
          }

          for (let step = 1; step <= span; step += 1) {
            path.push({
              x: current.x + direction * step,
              y: targetY
            });
          }

          for (let step = detour.depth - 1; step >= 0; step -= 1) {
            path.push({
              x: targetX,
              y: current.y + detour.verticalDirection * step
            });
          }

          baseIndex += span;
          horizontalRun = 0;
          nextDetourAfter = 5 + Math.floor(random() * 6);
          continue;
        }
      }
    } else {
      horizontalRun = 0;
    }

    path.push(next);
    baseIndex += 1;
  }

  const visited = new Set(path.map(pointKey));
  const expectedLength = columns * rows;
  let cleanupSteps = 0;
  const maxCleanupSteps = expectedLength * 2;

  while (visited.size < expectedLength) {
    const current = path.at(-1);
    if (!current) {
      break;
    }

    const adjacent = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ].filter(
      (point) =>
        point.x >= 0 &&
        point.x < columns &&
        point.y >= 0 &&
        point.y < rows
    );

    const unvisitedAdjacent = adjacent.filter(
      (point) => !visited.has(pointKey(point))
    );

    let next: Point | undefined;

    if (unvisitedAdjacent.length > 0) {
      const horizontal = unvisitedAdjacent.filter((point) => point.y === current.y);
      const candidates = horizontal.length > 0 && random() < 0.75
        ? horizontal
        : unvisitedAdjacent;
      next = candidates[Math.floor(random() * candidates.length)];
    } else {
      const remaining: Point[] = [];

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          const candidate = { x, y };
          if (!visited.has(pointKey(candidate))) {
            remaining.push(candidate);
          }
        }
      }

      const target = remaining
        .slice()
        .sort((left, right) => {
          const leftDistance =
            Math.abs(left.x - current.x) + Math.abs(left.y - current.y);
          const rightDistance =
            Math.abs(right.x - current.x) + Math.abs(right.y - current.y);
          return leftDistance - rightDistance;
        })[0];

      if (!target) {
        break;
      }

      const horizontalSteps = adjacent.filter(
        (point) =>
          point.y === current.y &&
          Math.abs(point.x - target.x) < Math.abs(current.x - target.x)
      );
      const verticalSteps = adjacent.filter(
        (point) =>
          point.x === current.x &&
          Math.abs(point.y - target.y) < Math.abs(current.y - target.y)
      );

      next = horizontalSteps[0] ?? verticalSteps[0];
    }

    if (!next) {
      break;
    }

    path.push(next);
    visited.add(pointKey(next));
    cleanupSteps += 1;

    if (cleanupSteps > maxCleanupSteps) {
      throw new Error("Snake path cleanup exceeded the maximum step budget.");
    }
  }

  return path;
}

function createSeededRandom(seed: number): () => number {
  let state = (seed >>> 0) + 0x6d2b79f5;

  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
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
