import assert from "node:assert/strict";
import test from "node:test";
import { getPuffAnchorIndices, renderSvg } from "../src/svg-renderer.js";

const HEART_MARKERS = /data-heart="true"|data-rainbow-heart="true"|M 0 7 C -10 0 -7 -8 0 -3/;

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
  assert.doesNotMatch(svg, HEART_MARKERS);
});

test("renders a color-matched heart that rises, grows, and fades as it ages", () => {
  const renderHeart = (age: number): string => renderSvg(
    [{ x: 0, y: 0, level: 0 as const }],
    {
      segments: [{ position: { x: 0, y: 0 }, color: "#f472b6", level: 0 as const }],
      consumed: new Set<string>()
    },
    1,
    1,
    { hearts: [{ position: { x: 0, y: 0 }, color: "#f472b6", age }] }
  );

  const fresh = renderHeart(0);
  const rising = renderHeart(2);
  const fading = renderHeart(5);
  const heartY = (svg: string): number => {
    const match = svg.match(/data-heart="true"[^>]*transform="translate[(]9[.]00 ([\d.-]+)[)] scale[(]/);
    assert.ok(match);
    return Number(match[1]);
  };

  assert.match(fresh, /data-heart="true" data-heart-age="0"/);
  assert.match(fresh, /fill="#f472b6" opacity="0.95"/);
  assert.ok(fresh.includes('transform="translate(9.00 9.00) scale(0.62)"'));
  assert.match(rising, /data-heart-age="2"/);
  assert.match(rising, /fill="#f472b6" opacity="0.58"/);
  assert.ok(heartY(rising) < heartY(fresh));
  assert.match(fading, /data-heart-age="5"/);
  assert.match(fading, /fill="#f472b6" opacity="0.00"/);
  assert.ok(heartY(fading) < heartY(rising));
});

test("draws no heart elements for a consumed contribution", () => {
  const svg = renderSvg(
    [{ x: 0, y: 0, level: 4 as const }],
    {
      segments: [{ position: { x: 0, y: 0 }, color: "#a855f7", level: 4 as const }],
      consumed: new Set(["0:0"])
    },
    1,
    1
  );

  assert.doesNotMatch(svg, HEART_MARKERS);
  assert.equal((svg.match(/<path /g) ?? []).length, 0);
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
    { snakeVisible: false }
  );

  assert.match(svg, /fill="#39d353"/);
  assert.doesNotMatch(svg, /fill="#a855f7"/);
});

test("draws a light bubble ring around every snake segment for an active puff burst", () => {
  const svg = renderSvg(
    [{ x: 0, y: 0, level: 0 as const }],
    {
      segments: [{ position: { x: 0, y: 0 }, color: "#a855f7", level: 0 as const }],
      consumed: new Set<string>()
    },
    2,
    1,
    { puffBursts: [{ index: 0, age: 0 }] }
  );

  // One center segment, four bubble directions, no heart markup.
  assert.equal((svg.match(/data-puff="true"/g) ?? []).length, 4);
  assert.match(
    svg,
    /data-puff="true" cx="6.00" cy="6.00" r="0.90" fill="none" stroke="#e6edf3" stroke-width="1.00" opacity="0.95"/
  );
  assert.match(svg, /data-puff="true"[^>]*stroke="#7dd3fc"/);
  assert.doesNotMatch(svg, HEART_MARKERS);
  assert.match(svg, /fill="#a855f7"/);
});

test("puff bubbles spread outwards, fade and disperse as the burst ages", () => {
  const renderPuff = (age: number): string => renderSvg(
    [{ x: 0, y: 0, level: 0 as const }],
    {
      segments: [{ position: { x: 0, y: 0 }, color: "#a855f7", level: 0 as const }],
      consumed: new Set<string>()
    },
    1,
    1,
    { puffBursts: [{ index: 0, age }] }
  );

  const fresh = renderPuff(0);
  const spreading = renderPuff(1);
  const dispersing = renderPuff(3);

  const bubbleSpread = (svg: string): number => {
    const match = svg.match(/data-puff="true" cx="(-?[\d.]+)" cy="(-?[\d.]+)"/);
    assert.ok(match);
    return 9 - Number(match[1]);
  };

  assert.equal(bubbleSpread(fresh), 3);
  assert.equal(bubbleSpread(spreading), 5);
  assert.equal(bubbleSpread(dispersing), 9);
  assert.match(fresh, /r="0.90"[^>]*opacity="0.95"/);
  assert.match(spreading, /r="1.30"[^>]*opacity="0.75"/);
  assert.match(dispersing, /r="1.40"[^>]*opacity="0.30"/);
  // The last burst frame only keeps half of the bubbles to suggest dispersal.
  assert.equal((dispersing.match(/data-puff="true"/g) ?? []).length, 2);
  assert.equal((spreading.match(/data-puff="true"/g) ?? []).length, 4);
});

test("limits puff bubbles to a few anchors along a long snake body", () => {
  const svg = renderSvg(
    [{ x: 0, y: 0, level: 0 as const }],
    {
      segments: Array.from({ length: 20 }, (_, index) => ({
        position: { x: index % 20, y: index < 20 ? 0 : 1 },
        color: "#a855f7",
        level: 0 as const
      })),
      consumed: new Set<string>()
    },
    20,
    2,
    { puffBursts: [{ index: 0, age: 1 }] }
  );

  // Five anchors, four bubble directions each, even for a twenty segment snake.
  assert.equal((svg.match(/data-puff="true"/g) ?? []).length, 20);
  assert.doesNotMatch(svg, HEART_MARKERS);
});

test("puff anchors always include the head and tail of the snake", () => {
  assert.deepEqual(getPuffAnchorIndices(0), []);
  assert.deepEqual(getPuffAnchorIndices(1), [0]);
  assert.deepEqual(getPuffAnchorIndices(5), [0, 1, 2, 3, 4]);
  assert.deepEqual(getPuffAnchorIndices(6), [0, 1, 3, 4, 5]);
  assert.deepEqual(getPuffAnchorIndices(67), [0, 17, 33, 50, 66]);
  assert.throws(() => getPuffAnchorIndices(-1), /non-negative integer/);
});

test("draws puff bubbles around every snake segment", () => {
  const svg = renderSvg(
    [{ x: 0, y: 0, level: 0 as const }, { x: 1, y: 0, level: 0 as const }],
    {
      segments: [
        { position: { x: 0, y: 0 }, color: "#3b82f6", level: 0 as const },
        { position: { x: 1, y: 0 }, color: "#f472b6", level: 1 as const }
      ],
      consumed: new Set<string>()
    },
    2,
    1,
    { puffBursts: [{ index: 1, age: 2 }] }
  );

  assert.equal((svg.match(/data-puff="true"/g) ?? []).length, 8);
  assert.match(svg, /fill="#3b82f6"/);
  assert.match(svg, /fill="#f472b6"/);
  assert.doesNotMatch(svg, HEART_MARKERS);
});

test("keeps the grid and the progress bar while the snake is hidden after the final puff", () => {
  const svg = renderSvg(
    [
      { x: 0, y: 0, level: 4 as const },
      { x: 1, y: 0, level: 2 as const }
    ],
    {
      segments: [
        { position: { x: 0, y: 0 }, color: "#a855f7", level: 4 as const },
        { position: { x: 1, y: 0 }, color: "#3b82f6", level: 0 as const }
      ],
      consumed: new Set(["0:0"])
    },
    2,
    1,
    { snakeVisible: false, puffBursts: [{ index: 2, age: 3 }] }
  );

  assert.doesNotMatch(svg, /fill="#a855f7"/);
  assert.doesNotMatch(svg, /fill="#3b82f6"/);
  assert.equal((svg.match(/data-puff="true"/g) ?? []).length, 0);
  assert.doesNotMatch(svg, HEART_MARKERS);
  assert.match(svg, /fill="#006d32"/);
  assert.match(svg, /data-progress-fill="true"[^>]*width="13.50"/);
});

test("renders a growing green progress bar based on consumed contributions", () => {
  const svg = renderSvg(
    [
      { x: 0, y: 0, level: 4 as const },
      { x: 1, y: 0, level: 2 as const }
    ],
    {
      segments: [{ position: { x: 0, y: 0 }, color: "#3b82f6", level: 0 as const }],
      consumed: new Set(["0:0"])
    },
    2,
    1
  );

  assert.doesNotMatch(svg, /data-progress-bar="true"/);
  assert.match(svg, /data-progress-fill="true"[^>]*width="13.50"[^>]*height="8"[^>]*rx="0"/);
  assert.match(svg, /stop-color="#7ee787"/);
  assert.match(svg, /stop-color="#006d32"/);
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
