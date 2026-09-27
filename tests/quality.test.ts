import assert from "node:assert/strict";
import test from "node:test";
import { MAX_ANIMATION_FRAMES, validateAnimationFrameCount } from "../src/quality.js";

test("accepts normal animation frame counts", () => {
  assert.doesNotThrow(() => validateAnimationFrameCount(371));
});

test("rejects runaway animation frame counts", () => {
  assert.throws(
    () => validateAnimationFrameCount(MAX_ANIMATION_FRAMES + 1),
    /frame count must be between/
  );
});
