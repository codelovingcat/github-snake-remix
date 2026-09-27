import type {
  GitHubContributionCalendar,
  GitHubContributionDay,
  GitHubContributionProvider,
  GitHubContributionWeek
} from "./github-contributions.js";
import type { ContributionLevel } from "./domain.js";

const ENDPOINT = "https://api.github.com/graphql";

const QUERY = `
query ContributionCalendar {
  viewer {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          firstDay
          contributionDays {
            date
            weekday
            contributionCount
            contributionLevel
            color
          }
        }
      }
    }
  }
}
`;

export interface GitHubGraphQlOptions {
  readonly token: string;
  readonly endpoint?: string;
  readonly fetchImpl?: typeof fetch;
}

type GraphQlPayload = {
  readonly data?: unknown;
  readonly errors?: unknown;
};

export class GitHubGraphQlContributionProvider implements GitHubContributionProvider {
  private readonly token: string;
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;

  public constructor(options: GitHubGraphQlOptions) {
    if (!options.token.trim()) {
      throw new Error("GitHub API token is required.");
    }

    this.token = options.token;
    this.endpoint = options.endpoint ?? ENDPOINT;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  public async getContributionCalendar(signal?: AbortSignal): Promise<GitHubContributionCalendar> {
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: QUERY }),
      ...(signal ? { signal } : {})
    });

    if (!response.ok) {
      throw new Error(`GitHub GraphQL request failed with HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as GraphQlPayload;

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      throw new Error("GitHub GraphQL returned an error.");
    }

    return parseCalendar(payload.data);
  }
}

function parseCalendar(data: unknown): GitHubContributionCalendar {
  if (!isRecord(data)) {
    throw new Error("GitHub GraphQL returned an invalid response.");
  }

  const viewer = data["viewer"];
  if (!isRecord(viewer)) {
    throw new Error("GitHub GraphQL response is missing viewer data.");
  }

  const collection = viewer["contributionsCollection"];
  if (!isRecord(collection)) {
    throw new Error("GitHub GraphQL response is missing contribution data.");
  }

  const calendar = collection["contributionCalendar"];
  if (!isRecord(calendar)) {
    throw new Error("GitHub GraphQL response is missing the contribution calendar.");
  }

  const totalContributions = readNonNegativeInteger(calendar["totalContributions"], "totalContributions");
  const weeksValue = calendar["weeks"];

  if (!Array.isArray(weeksValue)) {
    throw new Error("GitHub GraphQL response contains an invalid weeks collection.");
  }

  const weeks: GitHubContributionWeek[] = weeksValue.map((week, weekIndex) => parseWeek(week, weekIndex));

  return {
    totalContributions,
    weeks
  };
}

function parseWeek(value: unknown, weekIndex: number): GitHubContributionWeek {
  if (!isRecord(value)) {
    throw new Error(`GitHub GraphQL returned an invalid week at index ${weekIndex}.`);
  }

  const firstDay = readDate(value["firstDay"], `weeks[${weekIndex}].firstDay`);
  const daysValue = value["contributionDays"];

  if (!Array.isArray(daysValue)) {
    throw new Error(`GitHub GraphQL returned invalid days for week ${weekIndex}.`);
  }

  const days = daysValue.map((day, dayIndex) => parseDay(day, weekIndex, dayIndex));

  return { firstDay, days };
}

function parseDay(value: unknown, weekIndex: number, dayIndex: number): GitHubContributionDay {
  if (!isRecord(value)) {
    throw new Error(`GitHub GraphQL returned an invalid day at [${weekIndex},${dayIndex}].`);
  }

  const levelName = value["contributionLevel"];
  const level = mapContributionLevel(levelName);

  const weekday = readInteger(value["weekday"], `days[${weekIndex}][${dayIndex}].weekday`);
  if (weekday < 0 || weekday > 6) {
    throw new Error("GitHub contribution weekday must be between 0 and 6.");
  }

  return {
    date: readDate(value["date"], `days[${weekIndex}][${dayIndex}].date`),
    weekday,
    contributionCount: readNonNegativeInteger(
      value["contributionCount"],
      `days[${weekIndex}][${dayIndex}].contributionCount`
    ),
    level,
    color: readColor(value["color"])
  };
}

function mapContributionLevel(value: unknown): ContributionLevel {
  switch (value) {
    case "NONE":
      return 0;
    case "FIRST_QUARTILE":
      return 1;
    case "SECOND_QUARTILE":
      return 2;
    case "THIRD_QUARTILE":
      return 3;
    case "FOURTH_QUARTILE":
      return 4;
    default:
      throw new Error("GitHub returned an unknown contribution level.");
  }
}

function readDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`GitHub GraphQL field ${field} is not a valid date.`);
  }
  return value;
}

function readColor(value: unknown): string {
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error("GitHub GraphQL returned an invalid contribution color.");
  }
  return value;
}

function readInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`GitHub GraphQL field ${field} is not an integer.`);
  }
  return value;
}

function readNonNegativeInteger(value: unknown, field: string): number {
  const number = readInteger(value, field);
  if (number < 0) {
    throw new Error(`GitHub GraphQL field ${field} cannot be negative.`);
  }
  return number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
