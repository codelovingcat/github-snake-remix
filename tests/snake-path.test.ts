import assert from "node:assert/strict";
import test from "node:test";
import { planSnakePath } from "../src/snake-path.js";

const grid = {
  columns: 3,
  rows: 2,
  cells: []
};

test("plans a complete non-linear snake path", () => {
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
  const first = planSnakePath(grid, 42);
  const second = planSnakePath(grid, 42);

  assert.deepEqual(first, second);
  assert.equal(new Set(first.map((point) => `${point.x}:${point.y}`)).size, 6);

  for (let index = 1; index < first.length; index += 1) {
    const previous = first[index - 1];
    const current = first[index];

    assert.ok(
      previous &&
      current &&
      Math.abs(previous.x - current.x) + Math.abs(previous.y - current.y) === 1
    );
  }
});

test("different seeds can produce different valid paths", () => {
  const first = planSnakePath(grid, 1);
  const second = planSnakePath(grid, 9);

  assert.notDeepEqual(first, second);
});
