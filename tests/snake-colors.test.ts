import assert from "node:assert/strict";
import test from "node:test";
import { SnakeEngine } from "../src/snake-engine.js";

test("new snake starts with the empty-grid color", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  assert.equal(snake.state.segments[0]?.color, "#161b22");
  assert.equal(snake.state.segments[0]?.level, 0);
});

test("consuming a contribution changes the new head to that contribution color", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  snake.moveTo({ x: 1, y: 0 });
  assert.equal(snake.consume({ x: 2, y: 0, level: 4 }), true);
  assert.equal(snake.state.segments[0]?.color, "#39d353");
  assert.equal(snake.state.segments[0]?.level, 4);
});

test("the body keeps its previous segment colors after a new contribution is consumed", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  snake.moveTo({ x: 1, y: 0 });
  snake.consume({ x: 2, y: 0, level: 2 });
  assert.equal(snake.state.segments[0]?.color, "#006d32");
  assert.equal(snake.state.segments[1]?.color, "#161b22");
});
