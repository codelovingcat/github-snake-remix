import assert from "node:assert/strict";
import test from "node:test";
import { planSnakePath } from "../src/snake-path.js";

const grid = {
  columns: 3,
  rows: 2,
  cells: []
};

test("plans a complete non-linear snake path from the first grid cell", () => {
  const path = planSnakePath(grid);

  assert.deepEqual(path[0], { x: 0, y: 0 });
  assert.equal(path.length, 6);
  assert.equal(new Set(path.map((point) => `${point.x}:${point.y}`)).size, 6);
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

test("different seeds can produce different valid paths without changing the start", () => {
  const first = planSnakePath(grid, 1);
  const second = planSnakePath(grid, 9);
  const third = planSnakePath(grid, 17);

  assert.deepEqual(first[0], { x: 0, y: 0 });
  assert.deepEqual(second[0], { x: 0, y: 0 });
  assert.deepEqual(third[0], { x: 0, y: 0 });

  const uniquePaths = new Set([first, second, third].map((path) => JSON.stringify(path)));
  assert.ok(uniquePaths.size >= 2);
});
