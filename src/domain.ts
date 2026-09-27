export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface Cell {
  readonly x: number;
  readonly y: number;
  readonly level: ContributionLevel;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export function pointKey(point: Point): string {
  return `${point.x}:${point.y}`;
}

export function isAdjacent(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}
