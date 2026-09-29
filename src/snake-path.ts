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
  const path = buildRouteVariant(grid.columns, grid.rows, routeVariant, seed);

  validatePath(path, grid.columns, grid.rows);
  return path;
}

function buildRouteVariant(columns: number, rows: number, variant: number, seed: number): Point[] {
  if (variant === 1) {
    return buildJitteredRowSnake(columns, rows, seed);
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

function buildJitteredRowSnake(columns: number, rows: number, seed: number): Point[] {
  const basePath = buildRowSnake(columns, rows);

  if (columns < 2 || rows < 2) {
    return basePath;
  }

  const path: Point[] = [];
  const normalizedSeed = seed >>> 0;
  let horizontalMoves = 0;
  let detourCount = 0;

  const appendDetour = (current: Point, next: Point): boolean => {
    const preferredDepth = 1 + ((normalizedSeed + detourCount) % 2);
    const verticalDirections = ((normalizedSeed + detourCount) % 2 === 0)
      ? [1, -1]
      : [-1, 1];
    const preferredSpan = 2 + ((normalizedSeed + detourCount) % 2);
    const horizontalDirection = next.x > current.x ? 1 : -1;
    const horizontalDirections = [horizontalDirection, -horizontalDirection];

    for (const verticalDirection of verticalDirections) {
      for (let depth = preferredDepth; depth >= 1; depth -= 1) {
        const targetY = current.y + verticalDirection * depth;

        if (targetY < 0 || targetY >= rows) {
          continue;
        }

        for (const horizontalDir of horizontalDirections) {
          const maxSpan = horizontalDir > 0
            ? columns - 1 - current.x
            : current.x;
          const span = Math.min(preferredSpan, maxSpan);

          if (span < 1) {
            continue;
          }

          const targetX = current.x + horizontalDir * span;

          for (let step = 1; step <= depth; step += 1) {
            path.push({ x: current.x, y: current.y + verticalDirection * step });
          }

          for (let step = 1; step <= span; step += 1) {
            path.push({ x: current.x + horizontalDir * step, y: targetY });
          }

          const horizontalStep = next.x > targetX ? 1 : -1;
          for (let x = targetX + horizontalStep; ; x += horizontalStep) {
            path.push({ x, y: targetY });
            if (x === next.x) {
              break;
            }
          }

          for (let step = depth - 1; step >= 0; step -= 1) {
            path.push({ x: next.x, y: current.y + verticalDirection * step });
          }

          detourCount += 1;
          return true;
        }
      }
    }

    return false;
  };
  const first = basePath[0];
  if (first) {
    path.push(first);
  }

  for (let index = 1; index < basePath.length; index += 1) {
    const current = basePath[index - 1];
    const next = basePath[index];

    if (!current || !next) {
      continue;
    }

    const horizontal = current.y === next.y && current.x !== next.x;

    if (horizontal) {
      horizontalMoves += 1;
      const interval = 5 + ((normalizedSeed + current.y) % 3);

      if (horizontalMoves >= interval && appendDetour(current, next)) {
        horizontalMoves = 0;
        continue;
      }
    } else {
      horizontalMoves = 0;
    }

    path.push(next);
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
