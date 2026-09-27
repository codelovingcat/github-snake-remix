import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { renderAnimatedGif } from "../src/gif-output.js";

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
