import assert from "node:assert/strict";
import test from "node:test";
import { planSnakePath } from "../src/snake-path.js";

const grid = {
  columns: 53,
  rows: 7,
  cells: []
};

test("always starts from the first grid cell", () => {
  for (const seed of [0, 1, 2, 17, 12345]) {
    const path = planSnakePath(grid, seed);
    assert.deepEqual(path[0], { x: 0, y: 0 });
    assert.ok(path.length >= 53 * 7);
  }
});

test("uses three distinct route variants while keeping the same start", () => {
  const first = planSnakePath(grid, 0);
  const second = planSnakePath(grid, 1);
  const third = planSnakePath(grid, 2);

  assert.deepEqual(first[0], { x: 0, y: 0 });
  assert.deepEqual(second[0], { x: 0, y: 0 });
  assert.deepEqual(third[0], { x: 0, y: 0 });

  const uniquePaths = new Set(
    [first, second, third].map((path) => JSON.stringify(path))
  );

  assert.equal(uniquePaths.size, 3);
  assert.notDeepEqual(first, second);
  assert.notDeepEqual(second, third);
});

test("keeps every route valid and covers every grid coordinate", () => {
  for (const seed of [0, 1, 2, 17, 12345]) {
    const path = planSnakePath(grid, seed);

    assert.equal(new Set(path.map((point) => `${point.x}:${point.y}`)).size, 53 * 7);

    for (let index = 1; index < path.length; index += 1) {
      const previous = path[index - 1];
      const current = path[index];

      assert.ok(
        previous &&
        current &&
        Math.abs(previous.x - current.x) + Math.abs(previous.y - current.y) === 1
      );
    }
  }
});

test("the default horizontal route includes short one- or two-row detours", () => {
  const path = planSnakePath(grid, 1);
  const uniquePoints = new Set(path.map((point) => `${point.x}:${point.y}`));

  assert.ok(path.length > 53 * 7);
  assert.equal(uniquePoints.size, 53 * 7);

  let foundDetour = false;

  for (let index = 1; index < path.length - 2; index += 1) {
    const first = path[index - 1];
    const second = path[index];
    const third = path[index + 1];
    const fourth = path[index + 2];

    if (
      first &&
      second &&
      third &&
      fourth &&
      first.x === second.x &&
      second.y !== first.y &&
      second.y === third.y &&
      third.x !== second.x &&
      third.x === fourth.x &&
      fourth.y !== third.y
    ) {
      foundDetour = true;
      break;
    }
  }

  assert.equal(foundDetour, true);
});

test("same seed always selects the same route", () => {
  const first = planSnakePath(grid, 42);
  const second = planSnakePath(grid, 42);

  assert.deepEqual(first, second);
});

test("rejects non-integer seeds", () => {
  assert.throws(
    () => planSnakePath(grid, 1.5),
    /seed must be an integer/
  );
});
