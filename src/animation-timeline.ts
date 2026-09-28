import type { ContributionGrid } from "./contribution-grid.js";
import { planSnakePath } from "./snake-path.js";
import { SNAKE_COLOR_CYCLE, SnakeEngine, type SnakeState } from "./snake-engine.js";
import type { Point } from "./domain.js";

const HEART_LIFETIME_FRAMES = 9;
const COMMIT_WAIT_FRAMES = 1;
const FINALE_WAIT_FRAMES = 2;
const FINALE_BLINK_FRAMES = 6;
const FINALE_FRAMES_PER_COLOR = 2;

export interface HeartParticle {
  readonly origin: Point;
  readonly color: string;
  readonly age: number;
}

export interface AnimationFrame {
  readonly index: number;
  readonly elapsedMilliseconds: number;
  readonly state: SnakeState;
  readonly consumedDate?: string;
  readonly hearts?: readonly HeartParticle[];
  readonly snakeVisible?: boolean;
  readonly rainbowHeartColorIndex?: number;
  readonly rainbowHeartAge?: number;
  readonly delayMilliseconds?: number;
}

export interface AnimationOptions {
  readonly frameDurationMilliseconds?: number;
  readonly pathSeed?: number;
}

export function createAnimationTimeline(
  grid: ContributionGrid,
  options: AnimationOptions = {}
): readonly AnimationFrame[] {
  const duration = options.frameDurationMilliseconds ?? 90;
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
  const initialPoints = second ? [first, second] : [first];
  const snake = new SnakeEngine(first, second, initialPoints);
  const startIndex = second ? 2 : 1;
  let hearts: HeartParticle[] = [];
  const frames: AnimationFrame[] = [];

  const advanceHearts = (): void => {
    hearts = hearts
      .map((heart) => ({ ...heart, age: heart.age + 1 }))
      .filter((heart) => heart.age < HEART_LIFETIME_FRAMES);
  };

  const pushFrame = (overrides: Partial<AnimationFrame> = {}): void => {
    frames.push({
      index: frames.length,
      elapsedMilliseconds: frames.length * duration,
      state: snake.state,
      hearts: hearts.map((heart) => ({ ...heart, origin: { ...heart.origin } })),
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

  pushFrame({ hearts: [], snakeVisible: true });

  for (let index = startIndex; index < path.length; index += 1) {
    const point = path[index];
    if (!point) continue;

    const cell = byPoint.get(`${point.x}:${point.y}`);
    if (!cell) {
      throw new Error("Snake path references a missing contribution cell.");
    }

    if (cell.level > 0) {
      // Hold the current frame briefly, then consume and grow without blinking.
      extendLastFrameDelay(COMMIT_WAIT_FRAMES * duration);

      const consumed = snake.consume(cell);
      if (!consumed) {
        throw new Error("Snake could not consume an adjacent contribution cell.");
      }

      const state = snake.state;
      if (state.segments[0]) {
        hearts.push({
          origin: { x: cell.x, y: cell.y },
          color: state.segments[0].color,
          age: 0
        });
      }

      pushFrame({
        consumedDate: cell.date,
        snakeVisible: true
      });
      continue;
    }

    advanceHearts();
    snake.moveTo(point);
    pushFrame({ snakeVisible: true });
  }

  // End-of-run celebration: blink three times, pause, then every snake segment
  // cycles through every snake color while its heart grows and fades.
  extendLastFrameDelay(FINALE_WAIT_FRAMES * duration);

  for (let blink = 0; blink < FINALE_BLINK_FRAMES; blink += 1) {
    advanceHearts();
    pushFrame({ snakeVisible: blink % 2 === 1 });
  }

  for (let colorIndex = 0; colorIndex < SNAKE_COLOR_CYCLE.length; colorIndex += 1) {
    for (let age = 0; age < FINALE_FRAMES_PER_COLOR; age += 1) {
      advanceHearts();
      pushFrame({
        snakeVisible: true,
        rainbowHeartColorIndex: colorIndex,
        rainbowHeartAge: age
      });
    }
  }

  return frames;
}
