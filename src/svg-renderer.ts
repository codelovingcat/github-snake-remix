import type { Cell, Point } from "./domain.js";
import type { SnakeState } from "./snake-engine.js";
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

  const grid = cells.filter((cell) => !snake.consumed.has(`${cell.x}:${cell.y}`)).map((cell) => {
    const x = gap + cell.x * (cellSize + gap);
    const y = gap + cell.y * (cellSize + gap);
    return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${contributionColor(cell.level)}"/>`;
  }).join("");

  const snakeRects = snake.segments.map((segment, index) => {
    const centerX = gap + segment.position.x * (cellSize + gap) + cellSize / 2;
    const centerY = gap + segment.position.y * (cellSize + gap) + cellSize / 2;
    const sizeRatio = Math.max(0.28, 1 - index * 0.11);
    const size = cellSize * sizeRatio;
    const x = centerX - size / 2;
    const y = centerY - size / 2;
    const radius = Math.max(1.5, size * 0.2);
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" rx="${radius.toFixed(2)}" fill="${segment.color}"/>`;
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
