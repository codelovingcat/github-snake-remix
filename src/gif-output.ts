import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import GIFEncoder from "gif-encoder-2";
import sharp from "sharp";
import type { AnimationFrame } from "./animation-timeline.js";
import { renderSvg } from "./svg-renderer.js";

export interface GifOptions {
  readonly width?: number;
  readonly height?: number;
  readonly delayMilliseconds?: number;
  readonly repeat?: number;
  readonly quality?: number;
}

export async function renderAnimatedGif(
  frames: readonly AnimationFrame[],
  columns: number,
  rows: number,
  outputPath: string,
  options: GifOptions = {}
): Promise<void> {
  if (frames.length === 0) throw new Error("At least one animation frame is required.");

  const cellSize = 12;
  const gap = 3;
  const width = options.width ?? columns * (cellSize + gap) + gap;
  const height = options.height ?? rows * (cellSize + gap) + gap;
  const delay = options.delayMilliseconds ?? 90;
  const repeat = options.repeat ?? 0;
  const quality = options.quality ?? 10;

  if (width <= 0 || height <= 0 || delay <= 0 || quality < 1 || quality > 30) {
    throw new Error("Invalid GIF output options.");
  }

  const encoder = new GIFEncoder(width, height);
  encoder.setRepeat(repeat);
  encoder.setDelay(delay);
  encoder.setQuality(quality);

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(outputPath);
    encoder.createReadStream().pipe(output);
    output.on("finish", resolve);
    output.on("error", reject);
    encoder.start();

    void (async () => {
      try {
        for (const frame of frames) {
          const svg = renderSvg(
            frame.state.segments.map((segment) => ({
              x: segment.position.x,
              y: segment.position.y,
              level: segment.level
            })),
            frame.state,
            columns,
            rows
          );
          const png = await sharp(Buffer.from(svg)).png().raw().toBuffer({ resolveWithObject: true });
          encoder.addFrame(png.data);
        }
        encoder.finish();
      } catch (error) {
        encoder.abort();
        reject(error);
      }
    })();
  });
}

export async function writeAnimatedGif(
  frames: readonly AnimationFrame[],
  columns: number,
  rows: number,
  outputPath: string
): Promise<void> {
  await fs.mkdir(new URL(".", `file://${outputPath}`).pathname, { recursive: true }).catch(() => undefined);
  await renderAnimatedGif(frames, columns, rows, outputPath);
}
