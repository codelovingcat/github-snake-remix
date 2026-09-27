import type { ContributionLevel } from "./domain.js";

export const CONTRIBUTION_COLORS: Readonly<Record<ContributionLevel, string>> = {
  0: "#161b22",
  1: "#0e4429",
  2: "#006d32",
  3: "#26a641",
  4: "#39d353"
};

export function contributionColor(level: ContributionLevel): string {
  return CONTRIBUTION_COLORS[level];
}
