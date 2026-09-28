import type { Cell, Point } from "./domain.js";
import type { HeartParticle } from "./animation-timeline.js";
import { SNAKE_COLOR_CYCLE, type SnakeState } from "./snake-engine.js";
import { contributionColor } from "./colors.js";

export interface SvgOptions {
  readonly cellSize?: number;
  readonly gap?: number;
  readonly background?: string;
  readonly snakeVisible?: boolean;
  readonly rainbowHeartColorIndex?: number;
  readonly rainbowHeartAge?: number;
}

export const DEFAULT_CELL_SIZE = 12;
export const DEFAULT_GAP = 3;

const HEART_RISE_PER_FRAME = 1.5;
const HEART_OFFSET_FROM_CELL = 5;
const HEART_BASE_SCALE = 0.75;
const HEART_GROWTH_PER_FRAME = 0.08;
const HEART_OPACITY = [1, 1, 0.98, 0.9, 0.78, 0.62, 0.45, 0.25, 0.1] as const;

const PROGRESS_BAR_TOP_GAP = 6;
const PROGRESS_BAR_HEIGHT = 8;
const PROGRESS_BAR_BOTTOM_GAP = 3;
export const SVG_PROGRESS_EXTRA_HEIGHT =
  PROGRESS_BAR_TOP_GAP + PROGRESS_BAR_HEIGHT + PROGRESS_BAR_BOTTOM_GAP;

const RAINBOW_HEART_OFFSET = 7;
const RAINBOW_HEART_SCALE = 0.72;
const RAINBOW_HEART_GROWTH = 0.24;
const RAINBOW_HEART_OPACITY = [1, 0.55, 0] as const;
const RAINBOW_HEART_RISE = 1.25;

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

  const cellSize = options.cellSize ?? DEFAULT_CELL_SIZE;
  const gap = options.gap ?? DEFAULT_GAP;
  const background = options.background ?? "#0d1117";
  const width = columns * (cellSize + gap) + gap;
  const gridHeight = rows * (cellSize + gap) + gap;
  const height = gridHeight + SVG_PROGRESS_EXTRA_HEIGHT;

  const grid = cells.map((cell) => {
    const x = gap + cell.x * (cellSize + gap);
    const y = gap + cell.y * (cellSize + gap);
    const level = snake.consumed.has(`${cell.x}:${cell.y}`) ? 0 : cell.level;
    return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${contributionColor(level)}"/>`;
  }).join("");

  const snakeRects = options.snakeVisible === false
    ? ""
    : snake.segments.map((segment, index) => {
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
    const scale = (cellSize / 14) * (HEART_BASE_SCALE + heart.age * HEART_GROWTH_PER_FRAME);

    return [
      `<path data-heart="true" d="M 0 7 C -10 0 -7 -8 0 -3 C 7 -8 10 0 0 7 Z" `,
      `transform="translate(${centerX.toFixed(2)} ${centerY.toFixed(2)}) scale(${scale.toFixed(3)})" `,
      `fill="${heart.color}" opacity="${opacity.toFixed(2)}"/>`
    ].join("");
  }).join("");

  const totalContributions = cells.filter((cell) => cell.level > 0).length;
  const consumedContributions = cells.filter(
    (cell) => cell.level > 0 && snake.consumed.has(cell.x + ":" + cell.y)
  ).length;
  const progress = totalContributions === 0
    ? 0
    : Math.min(1, consumedContributions / totalContributions);
  const progressBarX = gap;
  const progressBarY = gridHeight + PROGRESS_BAR_TOP_GAP;
  const progressBarWidth = width - gap * 2;
  const progressFillWidth = progress === 0
    ? 0
    : Math.max(4, progressBarWidth * progress);

  const rainbowHeartRects = options.snakeVisible === false || options.rainbowHeartColorIndex === undefined
    ? ""
    : snake.segments.map((segment, index) => {
      const colorIndex =
        (options.rainbowHeartColorIndex! + index) % SNAKE_COLOR_CYCLE.length;
      const color = SNAKE_COLOR_CYCLE[colorIndex] ?? SNAKE_COLOR_CYCLE[0];
      const age = Math.max(0, Math.min(2, options.rainbowHeartAge ?? 0));
      const centerX = gap + segment.position.x * (cellSize + gap) + cellSize / 2;
      const centerY = gap
        + segment.position.y * (cellSize + gap)
        + cellSize / 2
        - RAINBOW_HEART_OFFSET
        - age * RAINBOW_HEART_RISE;
      const scale = (cellSize / 14) * (RAINBOW_HEART_SCALE + age * RAINBOW_HEART_GROWTH);
      const opacity = RAINBOW_HEART_OPACITY[age] ?? 0;

      return [
        `<path data-rainbow-heart="true" d="M 0 7 C -10 0 -7 -8 0 -3 C 7 -8 10 0 0 7 Z" `,
        `transform="translate(${centerX.toFixed(2)} ${centerY.toFixed(2)}) scale(${scale.toFixed(3)})" `,
        `fill="${color}" opacity="${opacity.toFixed(2)}"/>`
      ].join("");
    }).join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="GitHub contribution snake">`,
    `<defs><linearGradient id="progress-green" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#7ee787"/><stop offset="100%" stop-color="#006d32"/></linearGradient></defs>`,
    `<rect width="${width}" height="${height}" rx="8" fill="${background}"/>`,
    grid,
    snakeRects,
    heartRects,
    rainbowHeartRects,
    `<rect data-progress-bar="true" x="${progressBarX}" y="${progressBarY}" width="${progressBarWidth}" height="${PROGRESS_BAR_HEIGHT}" rx="4" fill="#161b22" stroke="#30363d" stroke-width="1"/>`,
    `<rect data-progress-fill="true" x="${progressBarX}" y="${progressBarY}" width="${progressFillWidth.toFixed(2)}" height="${PROGRESS_BAR_HEIGHT}" rx="4" fill="url(#progress-green)"/>`,
    "</svg>"
  ].join("");
}

export function moveRight(start: Point, count: number): Point {
  return { x: start.x + count, y: start.y };
}
