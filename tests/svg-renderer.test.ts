import assert from "node:assert/strict";
import test from "node:test";
import { renderSvg } from "../src/svg-renderer.js";

test("hides consumed contribution cells after the snake eats them", () => {
  const cells = [
    { x: 0, y: 0, level: 0 as const },
    { x: 1, y: 0, level: 4 as const }
  ];

  const svg = renderSvg(
    cells,
    {
      segments: [
        { position: { x: 0, y: 0 }, color: "#f472b6", level: 4 as const },
        { position: { x: 1, y: 0 }, color: "#3b82f6", level: 0 as const }
      ],
      consumed: new Set(["1:0"])
    },
    2,
    1
  );

  assert.equal((svg.match(/fill="#39d353"/g) ?? []).length, 0);
  assert.match(svg, /fill="#f472b6"/);
});

test("keeps unconsumed contribution cells visible", () => {
  const svg = renderSvg(
    [{ x: 0, y: 0, level: 4 as const }],
    {
      segments: [{ position: { x: 1, y: 0 }, color: "#3b82f6", level: 0 as const }],
      consumed: new Set<string>()
    },
    2,
    1
  );

  assert.match(svg, /fill="#39d353"/);
});
