import type { Cell, Point } from "./domain.js";
import type { HeartParticle, PuffBurst } from "./animation-timeline.js";
import type { SnakeState } from "./snake-engine.js";
import { contributionColor } from "./colors.js";

export interface SvgOptions {
  readonly cellSize?: number;
  readonly gap?: number;
  readonly background?: string;
  readonly snakeVisible?: boolean;
  readonly puffBursts?: readonly PuffBurst[];
  readonly hearts?: readonly HeartParticle[];
}

export const DEFAULT_CELL_SIZE = 12;
export const DEFAULT_GAP = 3;

const PROGRESS_BAR_TOP_GAP = 6;
const PROGRESS_BAR_HEIGHT = 8;
const PROGRESS_BAR_BOTTOM_GAP = 3;
export const SVG_PROGRESS_EXTRA_HEIGHT =
  PROGRESS_BAR_TOP_GAP + PROGRESS_BAR_HEIGHT + PROGRESS_BAR_BOTTOM_GAP;

// Small, light-colored bubble rings which spread outward around the snake and
// disperse over the lifetime of a puff burst. Bubbles are emitted from a few
// anchors along the body so a long snake puffs instead of turning into fog.
const PUFF_BUBBLE_COLORS = ["#e6edf3", "#7dd3fc"] as const;
const PUFF_BUBBLE_DIRECTIONS = [
  { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
] as const;
const PUFF_ANCHOR_LIMIT = 5;
const PUFF_BUBBLE_SPREAD_RATIO = 0.5;
const PUFF_BUBBLE_SPREAD_PER_AGE = 2;
const PUFF_BUBBLE_RADIUS_PER_AGE = [0.9, 1.3, 1.6, 1.4] as const;
const PUFF_BUBBLE_OPACITY_PER_AGE = [0.95, 0.75, 0.55, 0.3] as const;
const PUFF_BUBBLE_STROKE_WIDTH = 1;

const HEART_PATH = "M 0 5 C -1.7 3.4 -6 -0.1 -6 -3 C -6 -6.2 -1.8 -7.1 0 -3.6 C 1.8 -7.1 6 -6.2 6 -3 C 6 -0.1 1.7 3.4 0 5 Z";
const HEART_SCALE_PER_AGE = [0.62, 0.76, 0.9, 1.04, 1.18, 1.3] as const;
const HEART_OPACITY_PER_AGE = [0.95, 0.78, 0.58, 0.38, 0.18, 0] as const;
const HEART_RISE_PER_AGE = 2.2;

/**
 * Pick the body anchors a puff burst is emitted from: the head is always
 * included, and the remaining anchors are spread evenly along the body.
 */
export function getPuffAnchorIndices(segmentCount: number): readonly number[] {
  if (!Number.isInteger(segmentCount) || segmentCount < 0) {
    throw new Error("Segment count must be a non-negative integer.");
  }

  if (segmentCount <= PUFF_ANCHOR_LIMIT) {
    return Array.from({ length: segmentCount }, (_, index) => index);
  }

  const lastIndex = segmentCount - 1;
  return Array.from({ length: PUFF_ANCHOR_LIMIT }, (_, index) =>
    Math.round((index * lastIndex) / (PUFF_ANCHOR_LIMIT - 1))
  );
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

  const cellSize = options.cellSize ?? DEFAULT_CELL_SIZE;
  const gap = options.gap ?? DEFAULT_GAP;
  const background = options.background ?? "#0d1117";
  const width = columns * (cellSize + gap) + gap;
  const gridHeight = rows * (cellSize + gap) + gap;
  const height = gridHeight + SVG_PROGRESS_EXTRA_HEIGHT;
  const snakeVisible = options.snakeVisible !== false;
  const scale = cellSize / DEFAULT_CELL_SIZE;

  const grid = cells.map((cell) => {
    const x = gap + cell.x * (cellSize + gap);
    const y = gap + cell.y * (cellSize + gap);
    const level = snake.consumed.has(`${cell.x}:${cell.y}`) ? 0 : cell.level;
    return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${contributionColor(level)}"/>`;
  }).join("");

  const segmentSizes = snake.segments.map(
    (_segment, index) => cellSize * Math.max(0.28, 1 - index * 0.11)
  );

  const snakeRects = !snakeVisible
    ? ""
    : snake.segments.map((segment, index) => {
      const centerX = gap + segment.position.x * (cellSize + gap) + cellSize / 2;
      const centerY = gap + segment.position.y * (cellSize + gap) + cellSize / 2;
      const size = segmentSizes[index] ?? cellSize;
      const x = centerX - size / 2;
      const y = centerY - size / 2;
      const radius = Math.max(1.5, size * 0.2);
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" rx="${radius.toFixed(2)}" fill="${segment.color}"/>`;
    }).join("");

  const heartElements = (options.hearts ?? []).map((heart) => {
    const age = Math.max(0, Math.min(HEART_SCALE_PER_AGE.length - 1, heart.age));
    const heartScale = (HEART_SCALE_PER_AGE[age] ?? 1) * scale;
    const heartOpacity = HEART_OPACITY_PER_AGE[age] ?? 0;
    const centerX = gap + heart.position.x * (cellSize + gap) + cellSize / 2;
    const baseCenterY = gap + heart.position.y * (cellSize + gap) + cellSize / 2;
    const centerY = baseCenterY - age * HEART_RISE_PER_AGE * scale;

    return `<path data-heart="true" data-heart-age="${heart.age}" d="${HEART_PATH}" transform="translate(${centerX.toFixed(2)} ${centerY.toFixed(2)}) scale(${heartScale.toFixed(2)})" fill="${heart.color}" opacity="${heartOpacity.toFixed(2)}"/>`;
  });

  const puffBubbles: string[] = [];

  if (snakeVisible) {
    for (const burst of options.puffBursts ?? []) {
      const age = Math.max(0, Math.min(PUFF_BUBBLE_RADIUS_PER_AGE.length - 1, burst.age));
      const bubbleRadius = (PUFF_BUBBLE_RADIUS_PER_AGE[age] ?? 1) * scale;
      const bubbleOpacity = PUFF_BUBBLE_OPACITY_PER_AGE[age] ?? 0;
      const strokeWidth = PUFF_BUBBLE_STROKE_WIDTH * scale;
      // The last frame of a burst is sparse to suggest the bubbles dispersing.
      const sparse = age === PUFF_BUBBLE_RADIUS_PER_AGE.length - 1;

      for (const segmentIndex of getPuffAnchorIndices(snake.segments.length)) {
        const segment = snake.segments[segmentIndex];
        if (!segment) continue;

        const centerX = gap + segment.position.x * (cellSize + gap) + cellSize / 2;
        const centerY = gap + segment.position.y * (cellSize + gap) + cellSize / 2;
        const segmentRadius = (segmentSizes[segmentIndex] ?? cellSize) / 2;
        const spread =
          Math.round(segmentRadius * PUFF_BUBBLE_SPREAD_RATIO) +
          age * PUFF_BUBBLE_SPREAD_PER_AGE;

        PUFF_BUBBLE_DIRECTIONS.forEach((direction, directionIndex) => {
          if (sparse && directionIndex % 2 === 1) return;

          const color =
            PUFF_BUBBLE_COLORS[(directionIndex + age) % PUFF_BUBBLE_COLORS.length] ?? "#e6edf3";
          const bubbleX = centerX + direction.x * spread;
          const bubbleY = centerY + direction.y * spread;

          puffBubbles.push(
            `<circle data-puff="true" cx="${bubbleX.toFixed(2)}" cy="${bubbleY.toFixed(2)}" r="${bubbleRadius.toFixed(2)}" fill="none" stroke="${color}" stroke-width="${strokeWidth.toFixed(2)}" opacity="${bubbleOpacity.toFixed(2)}"/>`
          );
        });
      }
    }
  }

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

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="GitHub contribution snake">`,
    `<defs><linearGradient id="progress-green" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#7ee787"/><stop offset="100%" stop-color="#006d32"/></linearGradient></defs>`,
    `<rect width="${width}" height="${height}" rx="8" fill="${background}"/>`,
    grid,
    snakeRects,
    heartElements.join(""),
    puffBubbles.join(""),
    `<rect data-progress-fill="true" x="${progressBarX}" y="${progressBarY}" width="${progressFillWidth.toFixed(2)}" height="${PROGRESS_BAR_HEIGHT}" rx="0" fill="url(#progress-green)"/>`,
    "</svg>"
  ].join("");
}

export function moveRight(start: Point, count: number): Point {
  return { x: start.x + count, y: start.y };
}
