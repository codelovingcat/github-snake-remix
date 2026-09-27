# 🐍 GitHub Snake Remix

A custom GitHub contribution snake animation built from scratch with **TypeScript + SVG**, then encoded to an animated GIF for profile embedding.

This project is intentionally independent from the original profile-repository snake and does **not** use Platane/snk.

## How it works

```text
GitHub GraphQL
      ↓
Contribution calendar
      ↓
Deterministic grid
      ↓
Custom snake path
      ↓
Growth + snake color cycle
      ↓
Animation timeline
      ↓
SVG frame renderer
      ↓
Animated GIF
      ↓
output/snake.gif
```

## Visual rules

The snake grows by one segment when it consumes a non-empty contribution cell.

Each growth advances the snake through a fixed, deterministic color cycle:

- Initial state → blue
- 1st growth → soft pink
- 2nd growth → turquoise
- 3rd growth → yellow
- 4th growth → green
- 5th growth → blue
- Then the cycle repeats.

The contribution level still belongs to the consumed cell; it does not control the snake color.

The background follows GitHub's dark visual style.

## Quality guards

The generator rejects:

- empty animation timelines
- runaway frame counts above 500
- invalid GIF headers
- missing/empty artifacts
- GIFs larger than 1.5 MB
- unreasonable output dimensions

## Local development

```bash
npm install
npm test
npm run build
```

To generate against real GitHub data locally:

```bash
CONTRIBUTION_TOKEN=... npm run generate
```

Keep the token in your shell environment or a secret manager. Never commit it.

## GitHub Action

The workflow supports manual dispatch, weekly regeneration and regeneration after changes land on `main`.

The contribution calendar is read with `CONTRIBUTION_TOKEN`. The workflow's built-in `GITHUB_TOKEN` is used only for publishing the generated artifact.

## Profile output

The generated public artifact is published to the `output` branch:

```html
<img src="https://raw.githubusercontent.com/codelovingcat/github-snake-remix/output/snake.gif" alt="GitHub contribution snake" />
```

Set the repository secret `CONTRIBUTION_TOKEN` before the first generation run.
