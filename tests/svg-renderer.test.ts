import assert from "node:assert/strict";
import test from "node:test";
import { renderSvg } from "../src/svg-renderer.js";

test("keeps the consumed contribution cell visible but clears its green color", () => {
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
  assert.equal((svg.match(/fill="#161b22"/g) ?? []).length, 2);
  assert.match(svg, /x="18" y="3" width="12" height="12" rx="2" fill="#161b22"/);
  assert.match(svg, /fill="#f472b6"/);
});

test("renders a heart in the snake color for a consumed contribution", () => {
  const svg = renderSvg(
    [{ x: 0, y: 0, level: 4 as const }],
    {
      segments: [{ position: { x: 0, y: 0 }, color: "#a855f7", level: 4 as const }],
      consumed: new Set(["0:0"])
    },
    1,
    1,
    [{ origin: { x: 0, y: 0 }, color: "#a855f7", age: 0 }]
  );

  assert.match(
    svg,
    /data-heart="true"[^>]*fill="#a855f7"[^>]*opacity="1.00"/
  );
});

test("supports three blink cycles by hiding the snake without removing the grid", () => {
  const svg = renderSvg(
    [{ x: 0, y: 0, level: 4 as const }],
    {
      segments: [{ position: { x: 0, y: 0 }, color: "#a855f7", level: 4 as const }],
      consumed: new Set<string>()
    },
    1,
    1,
    [],
    { snakeVisible: false }
  );

  assert.match(svg, /fill="#39d353"/);
  assert.doesNotMatch(svg, /fill="#a855f7"/);
});

test("renders rainbow hearts for every snake segment", () => {
  const svg = renderSvg(
    [{ x: 0, y: 0, level: 0 as const }],
    {
      segments: [
        { position: { x: 0, y: 0 }, color: "#3b82f6", level: 0 as const },
        { position: { x: 1, y: 0 }, color: "#f472b6", level: 1 as const }
      ],
      consumed: new Set<string>()
    },
    2,
    1,
    [],
    { rainbowHeartColorIndex: 0, rainbowHeartAge: 1 }
  );

  assert.equal((svg.match(/data-rainbow-heart="true"/g) ?? []).length, 2);
  assert.match(svg, /data-rainbow-heart="true"[^>]*fill="#3b82f6"[^>]*opacity="0.55"/);
  assert.match(svg, /data-rainbow-heart="true"[^>]*fill="#f472b6"[^>]*opacity="0.55"/);
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
