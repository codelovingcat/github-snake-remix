import assert from "node:assert/strict";
import test from "node:test";
import { GitHubGraphQlContributionProvider } from "../src/github-graphql.js";

test("fetches and maps the contribution calendar without coupling to the core engine", async () => {
  let requestBody = "";

  const fetchImpl: typeof fetch = async (_input, init) => {
    requestBody = String(init?.body);

    return new Response(JSON.stringify({
      data: {
        viewer: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: 12,
              weeks: [
                {
                  firstDay: "2026-09-20",
                  contributionDays: [
                    {
                      date: "2026-09-20",
                      weekday: 0,
                      contributionCount: 4,
                      contributionLevel: "THIRD_QUARTILE",
                      color: "#26a641"
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    }), { status: 200 });
  };

  const provider = new GitHubGraphQlContributionProvider({
    token: "test-token",
    fetchImpl
  });

  const result = await provider.getContributionCalendar();

  assert.equal(result.totalContributions, 12);
  assert.equal(result.weeks[0]?.days[0]?.level, 3);
  assert.equal(result.weeks[0]?.days[0]?.color, "#26a641");

  const body = JSON.parse(requestBody) as { query: string };
  assert.match(body.query, /contributionCalendar/);
  assert.doesNotMatch(body.query, /test-token/);
});

test("rejects a missing token before sending a request", () => {
  assert.throws(
    () => new GitHubGraphQlContributionProvider({ token: "   " }),
    /GitHub API token is required/
  );
});

test("rejects GraphQL errors without exposing the response payload", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(JSON.stringify({
      errors: [{ message: "private failure details" }]
    }), { status: 200 });

  const provider = new GitHubGraphQlContributionProvider({
    token: "test-token",
    fetchImpl
  });

  await assert.rejects(
    () => provider.getContributionCalendar(),
    (error: unknown) => {
      assert.equal(error instanceof Error, true);
      assert.equal((error as Error).message, "GitHub GraphQL returned an error.");
      return true;
    }
  );
});
