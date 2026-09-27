import assert from "node:assert/strict";
import test from "node:test";
import { SnakeEngine } from "../src/snake-engine.js";

test("new snake starts with the custom blue start color", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  assert.equal(snake.state.segments[0]?.color, "#3b82f6");
  assert.equal(snake.state.segments[0]?.level, 0);
});

test("each growth advances to the next cute snake color", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  snake.moveTo({ x: 1, y: 0 });

  const colors = [
    snake.consume({ x: 2, y: 0, level: 1 }),
    snake.consume({ x: 3, y: 0, level: 2 }),
    snake.consume({ x: 4, y: 0, level: 3 }),
    snake.consume({ x: 5, y: 0, level: 4 }),
    snake.consume({ x: 6, y: 0, level: 1 })
  ];

  assert.deepEqual(colors, [true, true, true, true, true]);
  assert.deepEqual(
    snake.state.segments.slice(0, 5).map((segment) => segment.color),
    ["#3b82f6", "#4ade80", "#facc15", "#2dd4bf", "#f472b6"]
  );
});

test("each growth changes the head color from the previous growth", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  snake.moveTo({ x: 1, y: 0 });

  const observedColors: string[] = [];

  for (let x = 2; x <= 6; x += 1) {
    assert.equal(snake.consume({ x, y: 0, level: 1 }), true);
    const headColor = snake.state.segments[0]?.color;
    assert.ok(headColor);
    observedColors.push(headColor);
  }

  assert.deepEqual(observedColors, ["#f472b6", "#2dd4bf", "#facc15", "#4ade80", "#3b82f6"]);
});

test("the body keeps historical colors after later contributions are consumed", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });

  snake.moveTo({ x: 1, y: 0 });
  assert.equal(snake.consume({ x: 2, y: 0, level: 2 }), true);
  assert.equal(snake.consume({ x: 3, y: 0, level: 3 }), true);

  assert.deepEqual(
    snake.state.segments.slice(0, 3).map((segment) => segment.color),
    ["#2dd4bf", "#f472b6", "#3b82f6"]
  );
});
