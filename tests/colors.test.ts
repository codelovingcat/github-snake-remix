import assert from "node:assert/strict";
import test from "node:test";
import { contributionColor } from "../src/colors.js";

test("contribution levels map to four non-empty GitHub green shades", () => {
  const shades = [1, 2, 3, 4].map((level) => contributionColor(level as 1 | 2 | 3 | 4));

  assert.equal(new Set(shades).size, 4);
  for (const shade of shades) {
    assert.match(shade, /^#[0-9a-f]{6}$/);
  }
});

test("empty contribution cells use the dark grid color", () => {
  assert.equal(contributionColor(0), "#161b22");
});
