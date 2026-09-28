import assert from "node:assert/strict";
import test from "node:test";
import { createAnimationTimeline } from "../src/animation-timeline.js";

const grid = {
  columns: 2,
  rows: 2,
  cells: [
    { x: 0, y: 0, level: 0 as const, date: "2026-09-20", contributionCount: 0, color: "#161b22" },
    { x: 0, y: 1, level: 2 as const, date: "2026-09-21", contributionCount: 3, color: "#006d32" },
    { x: 1, y: 0, level: 4 as const, date: "2026-09-22", contributionCount: 8, color: "#39d353" },
    { x: 1, y: 1, level: 0 as const, date: "2026-09-23", contributionCount: 0, color: "#161b22" }
  ]
};

test("timeline is deterministic with explicit seed and elapsed time", () => {
  const first = createAnimationTimeline(grid, { frameDurationMilliseconds: 100, pathSeed: 1 });
  const second = createAnimationTimeline(grid, { frameDurationMilliseconds: 100, pathSeed: 1 });

  assert.deepEqual(first, second);
  assert.equal(first[0]?.elapsedMilliseconds, 0);
  assert.equal(first[0]?.snakeVisible, true);
});

test("a consumed contribution waits, blinks three times, then grows", () => {
  const frames = createAnimationTimeline(grid, { frameDurationMilliseconds: 80, pathSeed: 1 });

  // The path starts at (0,0) and reaches the first contribution at (0,1).
  // Frame 1 is the wait; frames 2-7 are three off/on blink cycles;
  // frame 8 is the growth/consume frame.
  assert.equal(frames[1]?.consumedDate, undefined);
  assert.equal(frames[1]?.state.segments.length, 1);
  assert.deepEqual(
    frames.slice(2, 8).map((frame) => frame.snakeVisible),
    [false, true, false, true, false, true]
  );

  assert.equal(frames[8]?.consumedDate, "2026-09-21");
  assert.equal(frames[8]?.state.segments.length, 2);
  assert.equal(frames[8]?.state.segments[0]?.color, "#f472b6");
  assert.equal(frames[8]?.hearts?.length, 1);
  assert.deepEqual(frames[8]?.hearts?.[0], {
    origin: { x: 0, y: 1 },
    color: "#f472b6",
    age: 0
  });
});

test("the final celebration cycles every palette color through rainbow hearts", () => {
  const frames = createAnimationTimeline(grid, { frameDurationMilliseconds: 80, pathSeed: 1 });

  const rainbowFrames = frames.filter((frame) => frame.rainbowHeartColorIndex !== undefined);
  assert.equal(rainbowFrames.length, 30);
  assert.deepEqual(
    rainbowFrames.slice(0, 3).map((frame) => frame.rainbowHeartColorIndex),
    [0, 0, 0]
  );
  assert.deepEqual(
    rainbowFrames.slice(0, 3).map((frame) => frame.rainbowHeartAge),
    [0, 1, 2]
  );

  const uniqueColors = new Set(rainbowFrames.map((frame) => frame.rainbowHeartColorIndex));
  assert.equal(uniqueColors.size, 10);
  assert.equal(rainbowFrames.at(-1)?.rainbowHeartAge, 2);
});

test("invalid frame duration and path seed are rejected", () => {
  assert.throws(
    () => createAnimationTimeline(grid, { frameDurationMilliseconds: 0 }),
    /positive integer/
  );

  assert.throws(
    () => createAnimationTimeline(grid, { pathSeed: 1.5 }),
    /Path seed must be an integer/
  );
});
