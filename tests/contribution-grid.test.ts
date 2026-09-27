import assert from "node:assert/strict";
import test from "node:test";
import { normalizeContributionCalendar } from "../src/contribution-grid.js";
import type { GitHubContributionCalendar } from "../src/github-contributions.js";

const fixture: GitHubContributionCalendar = {
  totalContributions: 5,
  weeks: [
    {
      firstDay: "2026-09-20",
      days: [
        { date: "2026-09-20", weekday: 0, contributionCount: 2, level: 2, color: "#006d32" },
        { date: "2026-09-21", weekday: 1, contributionCount: 0, level: 0, color: "#161b22" }
      ]
    },
    {
      firstDay: "2026-09-27",
      days: [
        { date: "2026-09-27", weekday: 0, contributionCount: 3, level: 3, color: "#26a641" }
      ]
    }
  ]
};

test("normalizes every week into a deterministic seven-row grid", () => {
  const grid = normalizeContributionCalendar(fixture);

  assert.equal(grid.columns, 2);
  assert.equal(grid.rows, 7);
  assert.equal(grid.cells.length, 14);
  assert.deepEqual(grid.cells[0], {
    x: 0, y: 0, level: 2, date: "2026-09-20", contributionCount: 2, color: "#006d32"
  });
  assert.deepEqual(grid.cells[7], {
    x: 1, y: 0, level: 3, date: "2026-09-27", contributionCount: 3, color: "#26a641"
  });
});

test("fills missing weekdays with deterministic empty cells", () => {
  const grid = normalizeContributionCalendar(fixture);

  const empty = grid.cells.find((cell) => cell.x === 1 && cell.y === 6);
  assert.ok(empty);
  assert.deepEqual(empty, {
    x: 1,
    y: 6,
    level: 0,
    date: "2026-10-03",
    contributionCount: 0,
    color: "#161b22"
  });
});

test("preserves returned contribution metadata", () => {
  const grid = normalizeContributionCalendar(fixture);
  const empty = grid.cells.find((cell) => cell.date === "2026-09-21");

  assert.ok(empty);
  assert.equal(empty.level, 0);
  assert.equal(empty.contributionCount, 0);
  assert.equal(empty.color, "#161b22");
});

test("same calendar produces the same grid", () => {
  const first = normalizeContributionCalendar(fixture);
  const second = normalizeContributionCalendar(fixture);

  assert.deepEqual(first, second);
});
