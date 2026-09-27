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

test("timeline is deterministic with explicit elapsed time", () => {
  const first = createAnimationTimeline(grid, { frameDurationMilliseconds: 100 });
  const second = createAnimationTimeline(grid, { frameDurationMilliseconds: 100 });

  assert.deepEqual(first, second);
  assert.equal(first.length, 4);
  assert.equal(first[1]?.elapsedMilliseconds, 100);
  assert.equal(first[2]?.elapsedMilliseconds, 200);
});

test("a consumed contribution is recorded on the corresponding frame", () => {
  const frames = createAnimationTimeline(grid, { frameDurationMilliseconds: 80 });

  assert.equal(frames[1]?.consumedDate, "2026-09-21");
  assert.equal(frames[1]?.state.segments.length, 2);
  assert.equal(frames[1]?.state.segments[0]?.color, "#f472b6");

  assert.equal(frames[3]?.consumedDate, "2026-09-22");
  assert.equal(frames[3]?.state.segments.length, 3);
  assert.equal(frames[3]?.state.segments[0]?.color, "#2dd4bf");
});

test("invalid frame duration is rejected", () => {
  assert.throws(
    () => createAnimationTimeline(grid, { frameDurationMilliseconds: 0 }),
    /positive integer/
  );
});
