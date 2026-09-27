import assert from "node:assert/strict";
import test from "node:test";
import { planSnakePath } from "../src/snake-path.js";

const grid = {
  columns: 3,
  rows: 2,
  cells: []
};

test("plans a complete serpentine path", () => {
  assert.deepEqual(planSnakePath(grid), [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 }
  ]);
});

test("path is deterministic and covers every grid coordinate once", () => {
  const first = planSnakePath(grid);
  const second = planSnakePath(grid);

  assert.deepEqual(first, second);
  assert.equal(new Set(first.map((point) => `${point.x}:${point.y}`)).size, 6);
});
