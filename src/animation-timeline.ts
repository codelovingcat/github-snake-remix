import type { ContributionGrid } from "./contribution-grid.js";
import { planSnakePath } from "./snake-path.js";
import { SnakeEngine, type SnakeState } from "./snake-engine.js";
import type { Point } from "./domain.js";

const HEART_LIFETIME_FRAMES = 9;

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
}

export interface AnimationOptions {
  readonly frameDurationMilliseconds?: number;
}

export function createAnimationTimeline(
  grid: ContributionGrid,
  options: AnimationOptions = {}
): readonly AnimationFrame[] {
  const duration = options.frameDurationMilliseconds ?? 90;
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error("Frame duration must be a positive integer.");
  }

  const path = planSnakePath(grid);
  const byPoint = new Map(grid.cells.map((cell) => [`${cell.x}:${cell.y}`, cell]));
  const first = path[0];
  if (!first) {
    return [];
  }

  const snake = new SnakeEngine(first);
  let hearts: HeartParticle[] = [];
  const frames: AnimationFrame[] = [{
    index: 0,
    elapsedMilliseconds: 0,
    state: snake.state,
    hearts: []
  }];

  for (let index = 1; index < path.length; index += 1) {
    const point = path[index];
    if (!point) continue;

    const cell = byPoint.get(`${point.x}:${point.y}`);
    if (!cell) {
      throw new Error("Snake path references a missing contribution cell.");
    }

    hearts = hearts
      .map((heart) => ({ ...heart, age: heart.age + 1 }))
      .filter((heart) => heart.age < HEART_LIFETIME_FRAMES);

    const before = snake.state;
    const consumed = cell.level > 0 && snake.consume(cell);
    if (!consumed) {
      snake.moveTo(point);
    }
    const state = snake.state;

    if (consumed && state.segments[0]) {
      hearts.push({
        origin: { x: cell.x, y: cell.y },
        color: state.segments[0].color,
        age: 0
      });
    }

    frames.push({
      index: frames.length,
      elapsedMilliseconds: frames.length * duration,
      state,
      hearts: hearts.map((heart) => ({ ...heart, origin: { ...heart.origin } })),
      ...(consumed && state.segments[0] && before.segments[0]
        ? { consumedDate: cell.date }
        : {})
    });
  }

  return frames;
}
