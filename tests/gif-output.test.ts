import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { FINALE_FRAME_COUNT, createAnimationTimeline } from "../src/animation-timeline.js";
import { renderAnimatedGif } from "../src/gif-output.js";
import { renderSvg } from "../src/svg-renderer.js";

function hexToRgb(hex: string): readonly [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];
}

function colorDistance(
  actual: readonly [number, number, number],
  expected: readonly [number, number, number]
): number {
  return Math.sqrt(
    (actual[0] - expected[0]) ** 2 +
    (actual[1] - expected[1]) ** 2 +
    (actual[2] - expected[2]) ** 2
  );
}

test("renders a non-empty animated GIF artifact", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "snake-gif-"));
  const output = path.join(directory, "snake.gif");

  const frames = [{
    index: 0,
    elapsedMilliseconds: 0,
    state: {
      segments: [{ position: { x: 0, y: 0 }, color: "#161b22", level: 0 as const }],
      consumed: new Set<string>()
    }
  }];

  await renderAnimatedGif(frames, 1, 1, output, { delayMilliseconds: 100 });

  const bytes = await fs.readFile(output);
  assert.ok(bytes.length > 20);
  assert.equal(bytes.subarray(0, 6).toString("ascii"), "GIF89a");
});

test("preserves different snake colors in different GIF frames", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "snake-colors-"));
  const output = path.join(directory, "colors.gif");

  const frames = [
    {
      index: 0,
      elapsedMilliseconds: 0,
      state: {
        segments: [{ position: { x: 0, y: 0 }, color: "#f472b6", level: 1 as const }],
        consumed: new Set<string>()
      }
    },
    {
      index: 1,
      elapsedMilliseconds: 100,
      state: {
        segments: [{ position: { x: 0, y: 0 }, color: "#2dd4bf", level: 1 as const }],
        consumed: new Set<string>()
      }
    }
  ];

  await renderAnimatedGif(frames, 1, 1, output, { delayMilliseconds: 100 });

  const metadata = await sharp(output, { animated: true }).metadata();
  assert.equal(metadata.pages, 2);
  const pageHeight = Number(metadata.pageHeight);
  assert.equal(pageHeight, 35);

  const { data, info } = await sharp(output, { animated: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  assert.equal(Number(info.pageHeight), pageHeight);
  assert.equal(info.pages, 2);

  const width = info.width;
  const channels = info.channels;
  const centerX = 9;
  const centerY = 9;

  assert.ok(width === 18);
  assert.ok(channels !== undefined);
  const pixelAt = (page: number): readonly [number, number, number] => {
    const offset = ((page * pageHeight + centerY) * width + centerX) * channels;
    return [data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0];
  };

  const first = pixelAt(0);
  const second = pixelAt(1);

  assert.ok(colorDistance(first, hexToRgb("#f472b6")) < 20);
  assert.ok(colorDistance(second, hexToRgb("#2dd4bf")) < 20);
  assert.ok(colorDistance(first, second) > 80);
});

test("creates a repository-relative nested output directory", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "snake-relative-"));
  const previous = process.cwd();
  process.chdir(directory);

  try {
    const output = "output/snake.gif";
    const frames = [{
      index: 0,
      elapsedMilliseconds: 0,
      state: {
        segments: [{ position: { x: 0, y: 0 }, color: "#161b22", level: 0 as const }],
        consumed: new Set<string>()
      }
    }];

    await renderAnimatedGif(frames, 1, 1, output, { delayMilliseconds: 100 });

    const bytes = await fs.readFile(path.join(directory, output));
    assert.equal(bytes.subarray(0, 6).toString("ascii"), "GIF89a");
  } finally {
    process.chdir(previous);
  }
});

const finaleGrid = {
  columns: 2,
  rows: 2,
  cells: [
    { x: 0, y: 0, level: 0 as const, date: "2026-09-20", contributionCount: 0, color: "#161b22" },
    { x: 0, y: 1, level: 2 as const, date: "2026-09-21", contributionCount: 3, color: "#006d32" },
    { x: 1, y: 0, level: 4 as const, date: "2026-09-22", contributionCount: 8, color: "#39d353" },
    { x: 1, y: 1, level: 0 as const, date: "2026-09-23", contributionCount: 0, color: "#161b22" }
  ]
};

test("keeps the finale in the GIF and clears the snake during the empty-grid beat", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "snake-finale-"));
  const output = path.join(directory, "finale.gif");
  const frames = createAnimationTimeline(finaleGrid, { frameDurationMilliseconds: 90, pathSeed: 1 });

  await renderAnimatedGif(frames, finaleGrid.columns, finaleGrid.rows, output, { delayMilliseconds: 90 }, finaleGrid.cells);

  const metadata = await sharp(output, { animated: true }).metadata();
  assert.equal(metadata.pages, frames.length);

  const pageHeight = Number(metadata.pageHeight);
  const { data, info } = await sharp(output, { animated: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const width = info.width;
  const channels = info.channels ?? 4;

  const finaleStart = frames.length - FINALE_FRAME_COUNT;
  const heldFrame = frames[finaleStart - 1];
  const head = heldFrame?.state.segments[0];

  assert.ok(finaleStart > 0);
  assert.ok(head);

  const column = 3 + head.position.x * 15 + 6;
  const row = 3 + head.position.y * 15 + 6;
  const pixelAt = (page: number): readonly [number, number, number] => {
    const offset = ((page * pageHeight + row) * width + column) * channels;
    return [data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0];
  };

  const headColor = hexToRgb(head.color);
  assert.ok(colorDistance(pixelAt(finaleStart - 1), headColor) < 60);
  assert.ok(colorDistance(pixelAt(frames.length - 1), headColor) > 80);
  assert.ok(colorDistance(pixelAt(frames.length - 1), hexToRgb("#161b22")) < 40);
});

test("no rendered animation frame contains heart markup", () => {
  const heartMarkers = /data-heart|data-rainbow-heart|M 0 7 C -10 0 -7 -8 0 -3/;
  const frames = createAnimationTimeline(finaleGrid, { frameDurationMilliseconds: 90, pathSeed: 1 });
  let puffFrames = 0;

  for (const frame of frames) {
    const svg = renderSvg(finaleGrid.cells, frame.state, finaleGrid.columns, finaleGrid.rows, {
      snakeVisible: frame.snakeVisible !== false,
      ...(frame.puffBursts !== undefined ? { puffBursts: frame.puffBursts } : {})
    });

    assert.doesNotMatch(svg, heartMarkers);

    if ((frame.puffBursts?.length ?? 0) > 0) {
      puffFrames += 1;
      assert.match(svg, /data-puff="true"/);
    } else {
      assert.doesNotMatch(svg, /data-puff="true"/);
    }
  }

  assert.ok(puffFrames > 0);
});
