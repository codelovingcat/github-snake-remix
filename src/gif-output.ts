import fs from "node:fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";
import GIFEncoder from "gif-encoder-2";
import sharp from "sharp";
import type { AnimationFrame } from "./animation-timeline.js";
import type { ContributionGridCell } from "./contribution-grid.js";
import { renderSvg } from "./svg-renderer.js";
import { validateGifArtifact, validateAnimationFrameCount } from "./quality.js";

export interface GifOptions {
  readonly width?: number;
  readonly height?: number;
  readonly delayMilliseconds?: number;
  readonly repeat?: number;
  readonly quality?: number;
  readonly maxBytes?: number;
}

export async function renderAnimatedGif(
  frames: readonly AnimationFrame[],
  columns: number,
  rows: number,
  outputPath: string,
  options: GifOptions = {},
  cells: readonly ContributionGridCell[] = []
): Promise<void> {
  validateAnimationFrameCount(frames.length);

  if (columns < 1 || rows < 1) {
    throw new Error("GIF grid dimensions must be positive.");
  }

  const cellSize = 12;
  const gap = 3;
  const width = options.width ?? columns * (cellSize + gap) + gap;
  const height = options.height ?? rows * (cellSize + gap) + gap;
  const delay = options.delayMilliseconds ?? 90;
  const repeat = options.repeat ?? 0;
  const quality = options.quality ?? 10;

  if (width <= 0 || height <= 0 || width > 1000 || height > 300 || delay <= 0 || quality < 1 || quality > 30) {
    throw new Error("Invalid GIF output dimensions or encoding options.");
  }

  await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });

  const encoder = new GIFEncoder(width, height);
  encoder.setRepeat(repeat);
  encoder.setDelay(delay);
  encoder.setQuality(quality);

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(outputPath);
    output.on("finish", resolve);
    output.on("error", reject);

    const stream = encoder.createReadStream();
    stream.on("error", reject);
    stream.pipe(output);

    void (async () => {
      try {
        encoder.start();

        for (const frame of frames) {
          const svg = renderSvg(cells, frame.state, columns, rows);
          const png = await sharp(Buffer.from(svg))
            .png()
            .raw()
            .toBuffer({ resolveWithObject: true });
          encoder.addFrame(png.data);
        }

        encoder.finish();
      } catch (error) {
        encoder.abort();
        reject(error);
      }
    })();
  });

  await validateGifArtifact(outputPath, options.maxBytes);
}

export async function writeAnimatedGif(
  frames: readonly AnimationFrame[],
  columns: number,
  rows: number,
  outputPath: string,
  options: GifOptions = {},
  cells: readonly ContributionGridCell[] = []
): Promise<void> {
  await renderAnimatedGif(frames, columns, rows, outputPath, options, cells);
}
