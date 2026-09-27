import type { ContributionGrid } from "./contribution-grid.js";
import { planSnakePath } from "./snake-path.js";
import { SnakeEngine, type SnakeState } from "./snake-engine.js";

export interface AnimationFrame {
  readonly index: number;
  readonly elapsedMilliseconds: number;
  readonly state: SnakeState;
  readonly consumedDate?: string;
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
  const frames: AnimationFrame[] = [{
    index: 0,
    elapsedMilliseconds: 0,
    state: snake.state
  }];

  for (let index = 1; index < path.length; index += 1) {
    const point = path[index];
    if (!point) continue;

    const cell = byPoint.get(`${point.x}:${point.y}`);
    if (!cell) {
      throw new Error("Snake path references a missing contribution cell.");
    }

    const before = snake.state;
    const consumed = cell.level > 0 && snake.consume(cell);
    if (!consumed) {
      snake.moveTo(point);
    }
    const state = consumed ? snake.state : snake.state;

    frames.push({
      index: frames.length,
      elapsedMilliseconds: frames.length * duration,
      state,
      ...(consumed && state.segments[0] && before.segments[0]
        ? { consumedDate: cell.date }
        : {})
    });
  }

  return frames;
}
