import assert from "node:assert/strict";
import test from "node:test";
import { SnakeEngine } from "../src/snake-engine.js";

test("snake grows by exactly one segment when it consumes a contribution cell", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });

  snake.moveTo({ x: 1, y: 0 });
  const grew = snake.consume({ x: 2, y: 0, level: 4 });

  assert.equal(grew, true);
  assert.equal(snake.state.segments.length, 2);
  assert.deepEqual(snake.state.segments[0], {
    position: { x: 2, y: 0 },
    color: "#3b82f6",
    level: 4
  });
});

test("the same contribution cell cannot be consumed twice", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  snake.moveTo({ x: 1, y: 0 });

  const cell = { x: 2, y: 0, level: 2 as const };
  assert.equal(snake.consume(cell), true);
  assert.equal(snake.consume(cell), false);
  assert.equal(snake.state.segments.length, 2);
});

test("zero-contribution cells are not edible", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  snake.moveTo({ x: 1, y: 0 });

  assert.equal(snake.consume({ x: 2, y: 0, level: 0 }), false);
  assert.equal(snake.state.segments.length, 1);
});
