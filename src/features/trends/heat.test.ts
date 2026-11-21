import { describe, expect, it } from "vitest";
import { heatScore } from "./heat";

describe("heatScore", () => {
  it("is 0 without a second snapshot or without new views", () => {
    expect(heatScore({ previousViews: null, currentViews: null, hoursBetween: 0, hoursSinceFirstSeen: 1 })).toBe(0);
    expect(heatScore({ previousViews: 500, currentViews: 500, hoursBetween: 12, hoursSinceFirstSeen: 1 })).toBe(0);
  });

  it("rises with faster growth", () => {
    const slow = heatScore({ previousViews: 1_000, currentViews: 2_000, hoursBetween: 24, hoursSinceFirstSeen: 10 });
    const fast = heatScore({ previousViews: 1_000, currentViews: 200_000, hoursBetween: 24, hoursSinceFirstSeen: 10 });
    expect(fast).toBeGreaterThan(slow);
  });

  it("favours newer items with the same growth", () => {
    const fresh = heatScore({ previousViews: 0, currentViews: 50_000, hoursBetween: 6, hoursSinceFirstSeen: 6 });
    const old = heatScore({ previousViews: 0, currentViews: 50_000, hoursBetween: 6, hoursSinceFirstSeen: 240 });
    expect(fresh).toBeGreaterThan(old);
  });

  it("stays within 0..100", () => {
    const score = heatScore({ previousViews: 0, currentViews: 1e12, hoursBetween: 0.01, hoursSinceFirstSeen: 0 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
