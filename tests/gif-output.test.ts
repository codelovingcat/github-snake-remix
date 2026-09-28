import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { renderAnimatedGif } from "../src/gif-output.js";

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
  assert.equal(Number(metadata.pageHeight), 18);

  const { data, info } = await sharp(output, { animated: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  assert.equal(Number(info.pageHeight), 18);
  assert.equal(info.pages, 2);

  const width = info.width;
  const channels = info.channels;
  const pageHeight = Number(info.pageHeight);
  const centerX = 9;
  const centerY = 9;

  assert.ok(width === 18);
  assert.ok(channels !== undefined);
  assert.ok(Number(pageHeight) === 18);

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
