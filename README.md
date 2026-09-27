# 🐍 GitHub Snake Remix

A custom GitHub contribution snake animation built from scratch with **TypeScript + SVG**.

This project is intentionally independent from the original profile-repository snake and does **not** use Platane/snk.

## Current architecture

```text
Contribution data
      ↓
Domain model
      ↓
Snake engine
      ↓
SVG renderer
      ↓
snake.svg
```

The core engine is GitHub-agnostic. GitHub API access and GitHub Actions publishing will be added separately.

## Contribution colors

Non-empty contribution levels use four green shades:

- Level 1 → light green
- Level 2 → medium green
- Level 3 → dark green
- Level 4 → deepest green

Empty cells use a dark GitHub-style background.

## Local development

```bash
npm install
npm test
npm run build
```

## Design principles

- TypeScript with strict compiler settings.
- Deterministic animation state.
- SVG output rather than a browser-only animation.
- No GitHub token in source code.
- No dependency on the old profile repository.
- Small, testable core before adding GitHub data and automation.

## Profile output

The generated animation is published to the `output` branch by GitHub Actions.

```html
<img src="https://raw.githubusercontent.com/codelovingcat/github-snake-remix/output/snake.gif" alt="GitHub contribution snake" />
```

Set the repository secret `CONTRIBUTION_TOKEN` before running the workflow.
