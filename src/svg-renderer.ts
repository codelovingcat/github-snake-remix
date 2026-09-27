import type { Cell, Point, SnakeState } from "./domain.js";
import { contributionColor } from "./colors.js";

export interface SvgOptions {
  readonly cellSize?: number;
  readonly gap?: number;
  readonly background?: string;
}

export function renderSvg(
  cells: readonly Cell[],
  snake: SnakeState,
  columns: number,
  rows: number,
  options: SvgOptions = {}
): string {
  if (columns < 1 || rows < 1) {
    throw new Error("SVG dimensions must be positive.");
  }

  const cellSize = options.cellSize ?? 12;
  const gap = options.gap ?? 3;
  const background = options.background ?? "#0d1117";
  const width = columns * (cellSize + gap) + gap;
  const height = rows * (cellSize + gap) + gap;

  const grid = cells.map((cell) => {
    const x = gap + cell.x * (cellSize + gap);
    const y = gap + cell.y * (cellSize + gap);
    return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${contributionColor(cell.level)}"/>`;
  }).join("");

  const snakeRects = snake.segments.map((segment, index) => {
    const x = gap + segment.position.x * (cellSize + gap);
    const y = gap + segment.position.y * (cellSize + gap);
    const opacity = Math.max(0.55, 1 - index * 0.025);
    return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3" fill="${segment.color}" opacity="${opacity.toFixed(3)}"/>`;
  }).join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="GitHub contribution snake">`,
    `<rect width="${width}" height="${height}" rx="8" fill="${background}"/>`,
    grid,
    snakeRects,
    "</svg>"
  ].join("");
}

export function moveRight(start: Point, count: number): Point {
  return { x: start.x + count, y: start.y };
}
