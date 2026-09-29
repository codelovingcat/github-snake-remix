import { randomInt } from "node:crypto";
import { GitHubGraphQlContributionProvider } from "./github-graphql.js";
import { normalizeContributionCalendar } from "./contribution-grid.js";
import { createAnimationTimeline } from "./animation-timeline.js";
import { renderAnimatedGif } from "./gif-output.js";

const token = process.env.CONTRIBUTION_TOKEN;
const outputPath = process.env.SNAKE_OUTPUT ?? "output/snake.gif";

if (!token) {
  throw new Error("CONTRIBUTION_TOKEN is required.");
}

const provider = new GitHubGraphQlContributionProvider({ token });
const calendar = await provider.getContributionCalendar();
const grid = normalizeContributionCalendar(calendar);
const configuredSeed = process.env.SNAKE_PATH_SEED;
const pathSeed = configuredSeed ? Number(configuredSeed) : randomInt(0, 0x1_0000_0000);

const timeline = createAnimationTimeline(grid, {
  frameDurationMilliseconds: 200,
  pathSeed
});

await renderAnimatedGif(timeline, grid.columns, grid.rows, outputPath, {
  delayMilliseconds: 90,
  repeat: 0,
  quality: 10,
  maxBytes: Number(process.env.SNAKE_MAX_BYTES ?? 1_500_000)
}, grid.cells);

console.log(`Generated snake artifact with ${timeline.length} frames.`);
