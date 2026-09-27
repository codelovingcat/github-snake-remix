import type { Cell, ContributionLevel } from "./domain.js";
import type { GitHubContributionCalendar, GitHubContributionDay } from "./github-contributions.js";

export interface ContributionGridCell extends Cell {
  readonly date: string;
  readonly contributionCount: number;
  readonly color: string;
}

export interface ContributionGrid {
  readonly columns: number;
  readonly rows: number;
  readonly cells: readonly ContributionGridCell[];
}

export function normalizeContributionCalendar(calendar: GitHubContributionCalendar): ContributionGrid {
  const days = calendar.weeks.flatMap((week) => week.days);
  const cells: ContributionGridCell[] = [];

  calendar.weeks.forEach((week, x) => {
    week.days.forEach((day) => {
      cells.push(toCell(day, x));
    });
  });

  const rows = Math.max(7, ...days.map((day) => day.weekday + 1));
  return { columns: calendar.weeks.length, rows, cells };
}

function toCell(day: GitHubContributionDay, x: number): ContributionGridCell {
  return {
    x,
    y: day.weekday,
    level: day.level as ContributionLevel,
    date: day.date,
    contributionCount: day.contributionCount,
    color: day.color
  };
}
