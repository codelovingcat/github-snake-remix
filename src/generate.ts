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
const timeline = createAnimationTimeline(grid, { frameDurationMilliseconds: 90 });

await renderAnimatedGif(timeline, grid.columns, grid.rows, outputPath, {
  delayMilliseconds: 90,
  repeat: 0,
  quality: 10
});

console.log(`Generated snake artifact with ${timeline.length} frames.`);
