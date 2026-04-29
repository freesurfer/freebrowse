import { describe, expect, it } from "vitest";

import {
  percentileFromSortedIntensities,
  percentileIntensity,
  sortedFiniteIntensities,
} from "./intensity-percentiles";

describe("intensity percentile helpers", () => {
  it("sorts finite values and excludes NaN and infinities", () => {
    const sortedValues = sortedFiniteIntensities([4, Number.NaN, 1, Infinity, 3]);

    expect(Array.from(sortedValues)).toEqual([1, 3, 4]);
  });

  it("interpolates percentile intensities", () => {
    const sortedValues = new Float32Array([0, 10, 20, 30, 40]);

    expect(percentileFromSortedIntensities(sortedValues, 25)).toBe(10);
    expect(percentileFromSortedIntensities(sortedValues, 12.5)).toBe(5);
  });

  it("clamps percentile bounds", () => {
    expect(percentileIntensity([10, 20, 30], -1)).toBe(10);
    expect(percentileIntensity([10, 20, 30], 101)).toBe(30);
  });
});
