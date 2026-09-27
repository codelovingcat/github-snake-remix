import type { ContributionLevel } from "./domain.js";

export interface GitHubContributionDay {
  readonly date: string;
  readonly weekday: number;
  readonly contributionCount: number;
  readonly level: ContributionLevel;
  readonly color: string;
}

export interface GitHubContributionWeek {
  readonly firstDay: string;
  readonly days: readonly GitHubContributionDay[];
}

export interface GitHubContributionCalendar {
  readonly totalContributions: number;
  readonly weeks: readonly GitHubContributionWeek[];
}

export interface GitHubContributionProvider {
  getContributionCalendar(signal?: AbortSignal): Promise<GitHubContributionCalendar>;
}
