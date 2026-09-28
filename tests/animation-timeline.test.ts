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

test("timeline is deterministic with explicit seed and always starts from the first cell", () => {
  const first = createAnimationTimeline(grid, { frameDurationMilliseconds: 100, pathSeed: 1 });
  const second = createAnimationTimeline(grid, { frameDurationMilliseconds: 100, pathSeed: 1 });

  assert.deepEqual(first, second);
  assert.equal(first[0]?.elapsedMilliseconds, 0);
  assert.equal(first[0]?.snakeVisible, true);
  assert.equal(first[0]?.state.segments.length, 2);
  assert.equal(first[0]?.state.segments[1]?.position.x, 0);
  assert.equal(first[0]?.state.segments[1]?.position.y, 0);
});

test("a consumed contribution pauses briefly, then grows without blinking", () => {
  const frames = createAnimationTimeline(grid, { frameDurationMilliseconds: 80, pathSeed: 9 });

  // The path always begins at (0,0) with a two-segment snake.
  // The first contribution is reached after the initial two points.
  const consumedIndex = frames.findIndex((frame) => frame.consumedDate === "2026-09-21");

  assert.ok(consumedIndex > 0);
  assert.equal(frames[consumedIndex - 1]?.delayMilliseconds, 160);
  assert.ok(frames.slice(0, consumedIndex).every((frame) => frame.snakeVisible !== false));
  assert.equal(frames[consumedIndex]?.state.segments.length, 3);
  assert.equal(frames[7]?.state.segments[0]?.color, "#f472b6");
  assert.equal(frames[7]?.hearts?.length, 1);
  assert.deepEqual(frames[7]?.hearts?.[0], {
    origin: { x: 0, y: 1 },
    color: "#f472b6",
    age: 0
  });
});

test("the final celebration keeps its three blink cycles and cycles every palette color through rainbow hearts", () => {
  const frames = createAnimationTimeline(grid, { frameDurationMilliseconds: 80, pathSeed: 1 });

  const rainbowFrames = frames.filter((frame) => frame.rainbowHeartColorIndex !== undefined);
  assert.equal(rainbowFrames.length, 20);
  assert.deepEqual(
    rainbowFrames.slice(0, 2).map((frame) => frame.rainbowHeartColorIndex),
    [0, 0]
  );
  assert.deepEqual(
    rainbowFrames.slice(0, 2).map((frame) => frame.rainbowHeartAge),
    [0, 1]
  );

  const uniqueColors = new Set(rainbowFrames.map((frame) => frame.rainbowHeartColorIndex));
  assert.equal(uniqueColors.size, 10);
  assert.equal(rainbowFrames.at(-1)?.rainbowHeartAge, 1);
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
