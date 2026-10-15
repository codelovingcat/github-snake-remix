import type { ContributionGrid } from "./contribution-grid.js";
import { planSnakePath } from "./snake-path.js";
import { SnakeEngine, type SnakeState } from "./snake-engine.js";
import type { Point } from "./domain.js";

/** Default frame cadence for a brisk, roughly 10 fps snake animation. */
export const DEFAULT_FRAME_DURATION_MILLISECONDS = 100;

const COMMIT_WAIT_FRAMES = 1;
const FINALE_WAIT_FRAMES = 2;
export const FINALE_BLINK_FRAMES = 6;
export const FINALE_PUFF_BURST_COUNT = 3;
export const FINALE_PUFF_BURST_INTERVAL_FRAMES = 4;
export const FINALE_PUFF_BURST_LIFETIME_FRAMES = 4;
export const FINALE_EMPTY_GRID_FRAMES = 3;
export const FINALE_FRAME_COUNT =
  FINALE_BLINK_FRAMES +
  (FINALE_PUFF_BURST_COUNT - 1) * FINALE_PUFF_BURST_INTERVAL_FRAMES +
  FINALE_PUFF_BURST_LIFETIME_FRAMES +
  FINALE_EMPTY_GRID_FRAMES;

export interface PuffBurst {
  readonly index: number;
  readonly age: number;
}

export interface AnimationFrame {
  readonly index: number;
  readonly elapsedMilliseconds: number;
  readonly state: SnakeState;
  readonly consumedDate?: string;
  readonly snakeVisible?: boolean;
  readonly puffBursts?: readonly PuffBurst[];
  readonly delayMilliseconds?: number;
}

export interface AnimationOptions {
  readonly frameDurationMilliseconds?: number;
  readonly pathSeed?: number;
}

/**
 * Return the puff bursts which are active in a finale puff frame. Each burst
 * starts a few frames after the previous one and expands while it disperses.
 */
export function getActivePuffBursts(puffFrameIndex: number): readonly PuffBurst[] {
  if (!Number.isInteger(puffFrameIndex) || puffFrameIndex < 0) {
    throw new Error("Puff frame index must be a non-negative integer.");
  }

  return Array.from({ length: FINALE_PUFF_BURST_COUNT }, (_, index) => index).flatMap((index) => {
    const age = puffFrameIndex - index * FINALE_PUFF_BURST_INTERVAL_FRAMES;
    return age >= 0 && age < FINALE_PUFF_BURST_LIFETIME_FRAMES ? [{ index, age }] : [];
  });
}

export function createAnimationTimeline(
  grid: ContributionGrid,
  options: AnimationOptions = {}
): readonly AnimationFrame[] {
  const duration = options.frameDurationMilliseconds ?? DEFAULT_FRAME_DURATION_MILLISECONDS;
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error("Frame duration must be a positive integer.");
  }

  const pathSeed = options.pathSeed ?? 1;
  if (!Number.isInteger(pathSeed)) {
    throw new Error("Path seed must be an integer.");
  }

  const path = planSnakePath(grid, pathSeed);
  const byPoint = new Map(grid.cells.map((cell) => [`${cell.x}:${cell.y}`, cell]));
  const first = path[0];
  if (!first) {
    return [];
  }

  const second = path[1];
  const initialGridCells = [first, second]
    .filter((point): point is Point => point !== undefined)
    .map((point) => byPoint.get(`${point.x}:${point.y}`))
    .filter((cell): cell is ContributionGrid["cells"][number] => cell !== undefined && cell.level > 0);
  const snake = new SnakeEngine(first, second, initialGridCells);
  const startIndex = second ? 2 : 1;
  const frames: AnimationFrame[] = [];

  const pushFrame = (overrides: Partial<AnimationFrame> = {}): void => {
    frames.push({
      index: frames.length,
      elapsedMilliseconds: frames.length * duration,
      state: snake.state,
      ...overrides
    });
  };

  const extendLastFrameDelay = (additionalMilliseconds: number): void => {
    const last = frames.at(-1);
    if (!last) return;

    const currentDelay = last.delayMilliseconds ?? duration;
    frames[frames.length - 1] = {
      ...last,
      delayMilliseconds: currentDelay + additionalMilliseconds
    };
  };

  pushFrame({ snakeVisible: true });

  for (let index = startIndex; index < path.length; index += 1) {
    const point = path[index];
    if (!point) continue;

    const cell = byPoint.get(`${point.x}:${point.y}`);
    if (!cell) {
      throw new Error("Snake path references a missing contribution cell.");
    }

    const pointKey = `${point.x}:${point.y}`;
    const alreadyConsumed = snake.state.consumed.has(pointKey);

    if (cell.level > 0 && !alreadyConsumed) {
      // Hold the current frame briefly, then consume and grow without blinking.
      extendLastFrameDelay(COMMIT_WAIT_FRAMES * duration);

      const consumed = snake.consume(cell);
      if (!consumed) {
        throw new Error("Snake could not consume an adjacent contribution cell.");
      }

      pushFrame({
        consumedDate: cell.date,
        snakeVisible: true
      });
      continue;
    }

    snake.moveTo(point);
    pushFrame({ snakeVisible: true });
  }

  // End-of-run finale: hold the final state briefly, blink three times while
  // every segment keeps its final color, puff away in three separate bursts,
  // then leave the contribution grid alone for a short empty-grid beat.
  extendLastFrameDelay(FINALE_WAIT_FRAMES * duration);

  for (let blink = 0; blink < FINALE_BLINK_FRAMES; blink += 1) {
    pushFrame({ snakeVisible: blink % 2 === 1 });
  }

  const puffFrameCount =
    (FINALE_PUFF_BURST_COUNT - 1) * FINALE_PUFF_BURST_INTERVAL_FRAMES +
    FINALE_PUFF_BURST_LIFETIME_FRAMES;

  for (let puffFrame = 0; puffFrame < puffFrameCount; puffFrame += 1) {
    pushFrame({
      snakeVisible: true,
      puffBursts: getActivePuffBursts(puffFrame)
    });
  }

  for (let emptyFrame = 0; emptyFrame < FINALE_EMPTY_GRID_FRAMES; emptyFrame += 1) {
    pushFrame({ snakeVisible: false });
  }

  return frames;
}
