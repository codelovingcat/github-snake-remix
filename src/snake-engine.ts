import { isAdjacent, pointKey, type Cell, type Point, type SnakeState } from "./domain.js";

export class SnakeEngine {
  private segments: Point[];
  private readonly consumed = new Set<string>();

  public constructor(start: Point) {
    this.segments = [start];
  }

  public get state(): SnakeState {
    return {
      segments: this.segments.map((segment) => ({ ...segment })),
      consumed: new Set(this.consumed)
    };
  }

  public moveTo(next: Point): void {
    const head = this.segments[0];
    if (!head || !isAdjacent(head, next)) {
      throw new Error("Snake can only move to an adjacent cell.");
    }

    this.segments.unshift({ ...next });
    this.segments.pop();
  }

  public consume(cell: Cell): boolean {
    const head = this.segments[0];

    if (!head || cell.level === 0 || !isAdjacent(head, cell)) {
      return false;
    }

    const key = pointKey(cell);
    if (this.consumed.has(key)) {
      return false;
    }

    this.segments.unshift({ x: cell.x, y: cell.y });
    this.consumed.add(key);
    return true;
  }
}
