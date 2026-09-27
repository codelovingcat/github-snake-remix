import { isAdjacent, pointKey, type Cell, type Point } from "./domain.js";

const SNAKE_START_COLOR = "#3b82f6";
const SNAKE_COLOR_CYCLE = ["#3b82f6", "#f472b6", "#2dd4bf", "#facc15", "#4ade80"] as const;

export interface SnakeSegment {
  readonly position: Point;
  readonly color: string;
  readonly level: Cell["level"];
}

export interface SnakeState {
  readonly segments: readonly SnakeSegment[];
  readonly consumed: ReadonlySet<string>;
}

export class SnakeEngine {
  private segments: SnakeSegment[];
  private readonly consumed = new Set<string>();

  public constructor(start: Point) {
    this.segments = [{ position: { ...start }, color: SNAKE_START_COLOR, level: 0 }];
  }

  public get state(): SnakeState {
    return {
      segments: this.segments.map((segment) => ({
        position: { ...segment.position },
        color: segment.color,
        level: segment.level
      })),
      consumed: new Set(this.consumed)
    };
  }

  public moveTo(next: Point): void {
    const head = this.segments[0];
    if (!head || !isAdjacent(head.position, next)) {
      throw new Error("Snake can only move to an adjacent cell.");
    }

    const nextSegment: SnakeSegment = {
      position: { ...next },
      color: head.color,
      level: head.level
    };

    this.segments = [nextSegment, ...this.segments.slice(0, -1)];
  }

  public consume(cell: Cell): boolean {
    const head = this.segments[0];

    if (!head || cell.level === 0 || !isAdjacent(head.position, cell)) {
      return false;
    }

    const key = pointKey(cell);
    if (this.consumed.has(key)) {
      return false;
    }

    this.segments = [{
      position: { x: cell.x, y: cell.y },
      color: SNAKE_COLOR_CYCLE[(this.consumed.size + 1) % SNAKE_COLOR_CYCLE.length] ?? SNAKE_START_COLOR,
      level: cell.level
    }, ...this.segments];

    this.consumed.add(key);
    return true;
  }
}
