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

test("the default horizontal route includes visible one- or two-row zigzags", () => {
  const path = planSnakePath(grid, 1);
  const uniquePoints = new Set(path.map((point) => `${point.x}:${point.y}`));

  assert.ok(path.length > 53 * 7);
  assert.equal(uniquePoints.size, 53 * 7);

  let foundVisibleDetour = false;

  for (let index = 1; index < path.length - 3; index += 1) {
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
      third.y === fourth.y &&
      third.x !== second.x &&
      fourth.x !== third.x
    ) {
      foundVisibleDetour = true;
      break;
    }
  }

  assert.equal(foundVisibleDetour, true);
});


test("natural detours are long enough to be visible and stay within the frame budget", () => {
  const path = planSnakePath(grid, 1);

  assert.ok(path.length <= grid.columns * grid.rows * 2);

  let foundNaturalDetour = false;

  for (let index = 0; index < path.length - 5; index += 1) {
    const start = path[index];
    const firstVertical = path[index + 1];

    if (
      !start ||
      !firstVertical ||
      start.x !== firstVertical.x ||
      start.y === firstVertical.y
    ) {
      continue;
    }

    let cursor = index + 1;
    let verticalDepth = 1;

    while (cursor + 1 < path.length) {
      const current = path[cursor];
      const next = path[cursor + 1];

      if (
        !current ||
        !next ||
        current.x !== next.x ||
        current.y === next.y
      ) {
        break;
      }

      verticalDepth += 1;
      cursor += 1;
    }

    if (verticalDepth < 1 || verticalDepth > 2) {
      continue;
    }

    let horizontalMoves = 0;

    while (cursor + 1 < path.length) {
      const current = path[cursor];
      const next = path[cursor + 1];

      if (
        !current ||
        !next ||
        current.y !== next.y ||
        current.x === next.x
      ) {
        break;
      }

      horizontalMoves += 1;
      cursor += 1;
    }

    if (horizontalMoves < 3 || cursor + verticalDepth >= path.length) {
      continue;
    }

    let returnCursor = cursor;
    let returnMoves = 0;

    while (returnMoves < verticalDepth && returnCursor + 1 < path.length) {
      const current = path[returnCursor];
      const next = path[returnCursor + 1];

      if (
        !current ||
        !next ||
        current.x !== next.x ||
        current.y === next.y
      ) {
        break;
      }

      returnMoves += 1;
      returnCursor += 1;
    }

    const returnEnd = path[returnCursor];

    if (
      returnMoves === verticalDepth &&
      returnEnd &&
      returnEnd.x === path[cursor]?.x &&
      returnEnd.y === start.y
    ) {
      foundNaturalDetour = true;
      break;
    }
  }

  assert.equal(foundNaturalDetour, true);
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
