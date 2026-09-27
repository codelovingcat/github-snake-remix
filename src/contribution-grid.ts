import type { Cell, ContributionLevel } from "./domain.js";
import { contributionColor } from "./colors.js";
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

const GRID_ROWS = 7;

export function normalizeContributionCalendar(calendar: GitHubContributionCalendar): ContributionGrid {
  const cells: ContributionGridCell[] = [];

  calendar.weeks.forEach((week, x) => {
    const daysByWeekday = new Map(week.days.map((day) => [day.weekday, day]));

    for (let weekday = 0; weekday < GRID_ROWS; weekday += 1) {
      const day = daysByWeekday.get(weekday);
      cells.push(day ? toCell(day, x) : createEmptyCell(week.firstDay, x, weekday));
    }
  });

  return {
    columns: calendar.weeks.length,
    rows: GRID_ROWS,
    cells
  };
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

function createEmptyCell(firstDay: string, x: number, weekday: number): ContributionGridCell {
  return {
    x,
    y: weekday,
    level: 0,
    date: addDays(firstDay, weekday),
    contributionCount: 0,
    color: contributionColor(0)
  };
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
