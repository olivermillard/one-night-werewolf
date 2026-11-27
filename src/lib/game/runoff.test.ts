import { describe, expect, it } from "vitest";
import { playersOf } from "./test-helpers";
import {
  planDeaths,
  resolveRunoff,
  runoffTally,
  validateRunoffBallot,
  type Runoff,
  type Votes,
} from "./vote";

const P = playersOf("Ann", "Ben", "Cat", "Dan", "Eve", "Fay", "Gus", "Hal", "Ivy", "Jon");

/** Build ballots that give each player exactly `counts[id]` votes. */
function ballots(counts: Record<string, number>): Votes {
  const votes: Votes = Object.fromEntries(P.map((p) => [p.id, [] as string[]]));
  const voters = P.map((p) => p.id);
  for (const [target, n] of Object.entries(counts)) {
    let given = 0;
    for (const voter of voters) {
      if (given === n) break;
      const ballot = votes[voter]!;
      if (voter === target || ballot.length >= 2 || ballot.includes(target)) continue;
      ballot.push(target);
      given += 1;
    }
    if (given !== n) throw new Error(`Couldn't give ${target} ${n} votes`);
  }
  return votes;
}

describe("when a tie decides who dies", () => {
  it("6-5-4: no tie-break, the 6 and the 5 die", () => {
    expect(planDeaths(P, ballots({ ann: 6, ben: 5, cat: 4 }))).toEqual({
      kind: "decided",
      deaths: ["ann", "ben"],
    });
  });

  it("5-5-3: no tie-break, both 5s die", () => {
    expect(planDeaths(P, ballots({ ann: 5, ben: 5, cat: 3 }))).toEqual({
      kind: "decided",
      deaths: ["ann", "ben"],
    });
  });

  it("6-5-5: the 6 dies, the two 5s go to a tie-break for one place", () => {
    expect(planDeaths(P, ballots({ ann: 6, ben: 5, cat: 5, dan: 1 }))).toEqual({
      kind: "runoff",
      locked: ["ann"],
      candidates: ["ben", "cat"],
      seats: 1,
    });
  });

  it("5-5-5: all three go to a tie-break for two places", () => {
    expect(planDeaths(P, ballots({ ann: 5, ben: 5, cat: 5 }))).toEqual({
      kind: "runoff",
      locked: [],
      candidates: ["ann", "ben", "cat"],
      seats: 2,
    });
  });

  it("3-3-2: the top two are tied with each other, so no tie-break; both die", () => {
    expect(planDeaths(P, ballots({ ann: 3, ben: 3, cat: 2 }))).toEqual({
      kind: "decided",
      deaths: ["ann", "ben"],
    });
  });

  it("3-2-2: the 3 dies; the two 2s go to a tie-break for second place", () => {
    expect(planDeaths(P, ballots({ ann: 3, ben: 2, cat: 2 }))).toEqual({
      kind: "runoff",
      locked: ["ann"],
      candidates: ["ben", "cat"],
      seats: 1,
    });
  });

  it("6-1-1: only the 6 dies (nobody else reached 2 votes)", () => {
    expect(planDeaths(P, ballots({ ann: 6, ben: 1, cat: 1 }))).toEqual({
      kind: "decided",
      deaths: ["ann"],
    });
  });
});

describe("resolving the tie-break", () => {
  const runoff = (votes: Votes, over: Partial<Runoff> = {}): Runoff => ({
    locked: ["ann"],
    candidates: ["ben", "cat"],
    seats: 1,
    votes,
    ...over,
  });

  it("the tied player with more tie-break votes dies", () => {
    const r = runoff({ ann: ["cat"], ben: ["cat"], cat: ["ben"], dan: ["cat"], eve: [] });
    expect(runoffTally(r)).toEqual({ ben: 1, cat: 3 });
    expect(resolveRunoff(r)).toEqual(["ann", "cat"]);
  });

  it("if the tie-break is tied too, everyone still tied dies", () => {
    const r = runoff({ ann: ["cat"], ben: ["cat"], cat: ["ben"], dan: ["ben"] });
    expect(resolveRunoff(r)).toEqual(["ann", "ben", "cat"]);
  });

  it("fills two places from a three-way tie", () => {
    const r = runoff(
      { ann: ["ben"], ben: ["cat"], cat: ["ben"], dan: ["cat"], eve: ["ben"], fay: ["dan"] },
      { locked: [], candidates: ["ann", "ben", "cat"], seats: 2 },
    );
    expect(resolveRunoff(r)).toEqual(["ben", "cat"]);
  });

  it("ignores votes for players who aren't tied, and self-votes", () => {
    const r = runoff({ ben: ["ben"], dan: ["eve"], eve: ["cat"] });
    expect(runoffTally(r)).toEqual({ ben: 0, cat: 1 });
  });

  it("checks tie-break ballots", () => {
    const r = runoff({});
    expect(validateRunoffBallot("dan", ["ben"], r)).toBeNull();
    expect(validateRunoffBallot("dan", [], r)).toBeNull();
    expect(validateRunoffBallot("dan", ["ben", "cat"], r)).toMatch(/one vote/);
    expect(validateRunoffBallot("dan", ["eve"], r)).toMatch(/Only the tied players/);
    expect(validateRunoffBallot("ben", ["ben"], r)).toMatch(/yourself/);
  });
});
