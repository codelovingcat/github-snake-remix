import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_FRAME_DURATION_MILLISECONDS,
  FINALE_BLINK_FRAMES,
  FINALE_EMPTY_GRID_FRAMES,
  FINALE_FRAME_COUNT,
  FINALE_PUFF_BURST_COUNT,
  FINALE_PUFF_BURST_INTERVAL_FRAMES,
  FINALE_PUFF_BURST_LIFETIME_FRAMES,
  createAnimationTimeline,
  getActivePuffBursts
} from "../src/animation-timeline.js";

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

const PUFF_FRAME_COUNT =
  (FINALE_PUFF_BURST_COUNT - 1) * FINALE_PUFF_BURST_INTERVAL_FRAMES +
  FINALE_PUFF_BURST_LIFETIME_FRAMES;

function finaleStartIndex(frames: ReturnType<typeof createAnimationTimeline>): number {
  return frames.length - FINALE_FRAME_COUNT;
}

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

test("default pacing uses the faster production frame cadence and a brief commit pause", () => {
  const frames = createAnimationTimeline(grid, { pathSeed: 9 });
  const consumedIndex = frames.findIndex((frame) => frame.consumedDate === "2026-09-21");

  assert.equal(DEFAULT_FRAME_DURATION_MILLISECONDS, 100);
  assert.equal(frames[1]?.elapsedMilliseconds, DEFAULT_FRAME_DURATION_MILLISECONDS);
  assert.ok(consumedIndex > 0);
  assert.equal(frames[consumedIndex - 1]?.delayMilliseconds, DEFAULT_FRAME_DURATION_MILLISECONDS * 2);
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
  assert.equal(frames[consumedIndex]?.state.segments[0]?.color, "#2dd4bf");
});

test("the finale holds the final state and blinks three times without changing segment colors", () => {
  const duration = 80;
  const frames = createAnimationTimeline(grid, { frameDurationMilliseconds: duration, pathSeed: 1 });
  const blinkStart = finaleStartIndex(frames);
  const lastRouteFrame = frames[blinkStart - 1];
  const blinkFrames = frames.slice(blinkStart, blinkStart + FINALE_BLINK_FRAMES);

  assert.ok(blinkStart > 0);
  assert.equal(frames.length, blinkStart + FINALE_FRAME_COUNT);
  // The last route frame is held for two extra frame durations.
  assert.equal(lastRouteFrame?.delayMilliseconds, 3 * duration);
  assert.equal(blinkFrames.length, FINALE_BLINK_FRAMES);
  assert.deepEqual(
    blinkFrames.map((frame) => frame.snakeVisible),
    [false, true, false, true, false, true]
  );
  assert.equal(blinkFrames.filter((frame) => frame.snakeVisible === false).length, 3);
  assert.ok(
    blinkFrames.every(
      (frame) =>
        JSON.stringify(frame.state.segments.map((segment) => segment.color)) ===
        JSON.stringify(lastRouteFrame?.state.segments.map((segment) => segment.color))
    )
  );
});

test("the finale puffs away in three bursts and then leaves an empty-grid beat", () => {
  const frames = createAnimationTimeline(grid, { frameDurationMilliseconds: 80, pathSeed: 1 });
  const blinkStart = finaleStartIndex(frames);
  const puffFrames = frames.slice(blinkStart + FINALE_BLINK_FRAMES, blinkStart + FINALE_BLINK_FRAMES + PUFF_FRAME_COUNT);
  const emptyFrames = frames.slice(blinkStart + FINALE_BLINK_FRAMES + PUFF_FRAME_COUNT);

  assert.equal(puffFrames.length, PUFF_FRAME_COUNT);
  assert.deepEqual(
    puffFrames.map((frame) => frame.puffBursts?.map((burst) => burst.index).join(",")),
    ["0", "0", "0", "0", "1", "1", "1", "1", "2", "2", "2", "2"]
  );
  assert.deepEqual(
    puffFrames.map((frame) => frame.puffBursts?.map((burst) => burst.age).join(",")),
    ["0", "1", "2", "3", "0", "1", "2", "3", "0", "1", "2", "3"]
  );
  assert.ok(puffFrames.every((frame) => frame.snakeVisible === true));

  assert.equal(emptyFrames.length, FINALE_EMPTY_GRID_FRAMES);
  assert.ok(emptyFrames.every((frame) => frame.snakeVisible === false));
  assert.ok(emptyFrames.every((frame) => frame.puffBursts === undefined));
  assert.deepEqual(
    emptyFrames.at(-1)?.state.consumed,
    frames[blinkStart - 1]?.state.consumed
  );
});

test("the finale keeps the final segment colors and never creates hearts", () => {
  const frames = createAnimationTimeline(grid, { frameDurationMilliseconds: 80, pathSeed: 1 });
  const blinkStart = finaleStartIndex(frames);
  const finaleFrames = frames.slice(blinkStart);
  const finalColors = finaleFrames[0]?.state.segments.map((segment) => segment.color);

  assert.ok(finalColors);
  assert.ok(finalColors.length > 0);
  assert.deepEqual(
    finaleFrames.map((frame) => frame.state.segments.map((segment) => segment.color)),
    finaleFrames.map(() => finalColors)
  );

  const forbidden = ["hearts", "rainbowHeartColorIndex", "rainbowHeartAge"];

  for (const frame of frames) {
    assert.deepEqual(
      Object.keys(frame).filter((key) => forbidden.includes(key)),
      []
    );
    assert.equal(Object.hasOwn(frame, "hearts"), false);
  }
});

test("active puff bursts are reported per frame with a bounded age", () => {
  assert.deepEqual(getActivePuffBursts(0), [{ index: 0, age: 0 }]);
  assert.deepEqual(getActivePuffBursts(FINALE_PUFF_BURST_INTERVAL_FRAMES), [{ index: 1, age: 0 }]);
  assert.deepEqual(
    getActivePuffBursts(FINALE_PUFF_BURST_LIFETIME_FRAMES),
    [{ index: 1, age: 0 }]
  );
  assert.deepEqual(
    getActivePuffBursts((FINALE_PUFF_BURST_COUNT - 1) * FINALE_PUFF_BURST_INTERVAL_FRAMES),
    [{ index: 2, age: 0 }]
  );
  assert.deepEqual(getActivePuffBursts(PUFF_FRAME_COUNT), []);
  assert.throws(() => getActivePuffBursts(-1), /non-negative integer/);
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
