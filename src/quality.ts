import fs from "node:fs/promises";

export const MAX_ANIMATION_FRAMES = 500;
export const MAX_GIF_BYTES = 1_500_000;

export function validateAnimationFrameCount(frameCount: number): void {
  if (!Number.isInteger(frameCount) || frameCount < 1 || frameCount > MAX_ANIMATION_FRAMES) {
    throw new Error(`Animation frame count must be between 1 and ${MAX_ANIMATION_FRAMES}.`);
  }
}

export async function validateGifArtifact(
  filePath: string,
  maxBytes = MAX_GIF_BYTES
): Promise<void> {
  const stat = await fs.stat(filePath);

  if (!stat.isFile() || stat.size < 20) {
    throw new Error("Generated GIF artifact is missing or empty.");
  }

  if (stat.size > maxBytes) {
    throw new Error(`Generated GIF artifact exceeds the ${maxBytes}-byte limit.`);
  }

  const header = Buffer.alloc(6);
  const handle = await fs.open(filePath, "r");
  try {
    await handle.read(header, 0, header.length, 0);
  } finally {
    await handle.close();
  }

  const signature = header.toString("ascii");
  if (signature !== "GIF87a" && signature !== "GIF89a") {
    throw new Error("Generated artifact is not a valid GIF.");
  }
}
