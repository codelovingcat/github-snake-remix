import assert from "node:assert/strict";
import test from "node:test";
import { SnakeEngine } from "../src/snake-engine.js";

test("new snake starts with the custom blue start color", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  assert.equal(snake.state.segments[0]?.color, "#3b82f6");
  assert.equal(snake.state.segments[0]?.level, 0);
});

test("the first consumed contribution switches the new head to a non-blue color", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  snake.moveTo({ x: 1, y: 0 });

  assert.equal(snake.consume({ x: 2, y: 0, level: 4 }), true);
  assert.equal(snake.state.segments[0]?.color, "#ff3b30");
  assert.notEqual(snake.state.segments[0]?.color, "#3b82f6");
  assert.equal(snake.state.segments[0]?.level, 4);
});

test("three consecutive contributions advance through distinct snake colors", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });

  snake.moveTo({ x: 1, y: 0 });
  assert.equal(snake.consume({ x: 2, y: 0, level: 1 }), true);

  snake.moveTo({ x: 3, y: 0 });
  assert.equal(snake.consume({ x: 4, y: 0, level: 2 }), true);

  snake.moveTo({ x: 5, y: 0 });
  assert.equal(snake.consume({ x: 6, y: 0, level: 3 }), true);

  const colors = snake.state.segments.slice(0, 3).map((segment) => segment.color);
  assert.deepEqual(colors, ["#af52de", "#ff9500", "#ff3b30"]);
  assert.notEqual(colors[0], colors[1]);
  assert.notEqual(colors[1], colors[2]);
  assert.notEqual(colors[0], colors[2]);
});

test("the body keeps historical colors after later contributions are consumed", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });

  snake.moveTo({ x: 1, y: 0 });
  snake.consume({ x: 2, y: 0, level: 2 });

  snake.moveTo({ x: 3, y: 0 });
  snake.consume({ x: 4, y: 0, level: 3 });

  assert.deepEqual(
    snake.state.segments.slice(0, 3).map((segment) => segment.color),
    ["#ff9500", "#ff3b30", "#3b82f6"]
  );
});
