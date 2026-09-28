import assert from "node:assert/strict";
import test from "node:test";
import { SnakeEngine } from "../src/snake-engine.js";

test("new snake starts with the custom blue start color", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  assert.equal(snake.state.segments[0]?.color, "#3b82f6");
  assert.equal(snake.state.segments[0]?.level, 0);
});

test("each growth advances through the full extended cute snake color palette", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });

  snake.moveTo({ x: 1, y: 0 });
  for (let x = 2; x <= 11; x += 1) {
    assert.equal(snake.consume({ x, y: 0, level: 1 }), true);
  }

  assert.deepEqual(
    snake.state.segments.slice(0, 10).map((segment) => segment.color),
    [
      "#3b82f6",
      "#93c5fd",
      "#f9a8d4",
      "#ef4444",
      "#c084fc",
      "#a855f7",
      "#4ade80",
      "#facc15",
      "#2dd4bf",
      "#f472b6"
    ]
  );
});

test("each growth changes the head color from the previous growth", () => {
  const snake = new SnakeEngine({ x: 0, y: 0 });
  snake.moveTo({ x: 1, y: 0 });

  const observedColors: string[] = [];

  for (let x = 2; x <= 11; x += 1) {
    assert.equal(snake.consume({ x, y: 0, level: 1 }), true);
    const headColor = snake.state.segments[0]?.color;
    assert.ok(headColor);
    observedColors.push(headColor);
  }

  assert.deepEqual(observedColors, [
    "#f472b6",
    "#2dd4bf",
    "#facc15",
    "#4ade80",
    "#a855f7",
    "#c084fc",
    "#ef4444",
    "#f9a8d4",
    "#93c5fd",
    "#3b82f6"
  ]);
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
