import type { Cell, Point } from "./domain.js";
import type { HeartParticle } from "./animation-timeline.js";
import type { SnakeState } from "./snake-engine.js";
import { contributionColor } from "./colors.js";

export interface SvgOptions {
  readonly cellSize?: number;
  readonly gap?: number;
  readonly background?: string;
}

const HEART_RISE_PER_FRAME = 2;
const HEART_OFFSET_FROM_CELL = 5;
const HEART_OPACITY = [1, 0.85, 0.7, 0.5, 0.25] as const;

export function renderSvg(
  cells: readonly Cell[],
  snake: SnakeState,
  columns: number,
  rows: number,
  hearts: readonly HeartParticle[] = [],
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
    const level = snake.consumed.has(`${cell.x}:${cell.y}`) ? 0 : cell.level;
    return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${contributionColor(level)}"/>`;
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

  const heartRects = hearts.map((heart) => {
    const centerX = gap + heart.origin.x * (cellSize + gap) + cellSize / 2;
    const centerY = gap
      + heart.origin.y * (cellSize + gap)
      + cellSize / 2
      - HEART_OFFSET_FROM_CELL
      - heart.age * HEART_RISE_PER_FRAME;
    const opacity = HEART_OPACITY[Math.min(heart.age, HEART_OPACITY.length - 1)] ?? 0;
    const scale = cellSize / 14;

    return [
      `<path data-heart="true" d="M 0 7 C -10 0 -7 -8 0 -3 C 7 -8 10 0 0 7 Z" `,
      `transform="translate(${centerX.toFixed(2)} ${centerY.toFixed(2)}) scale(${scale.toFixed(3)})" `,
      `fill="${heart.color}" opacity="${opacity.toFixed(2)}"/>`
    ].join("");
  }).join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="GitHub contribution snake">`,
    `<rect width="${width}" height="${height}" rx="8" fill="${background}"/>`,
    grid,
    snakeRects,
    heartRects,
    "</svg>"
  ].join("");
}

export function moveRight(start: Point, count: number): Point {
  return { x: start.x + count, y: start.y };
}
