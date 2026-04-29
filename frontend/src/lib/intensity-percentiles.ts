export function sortedFiniteIntensities(values: ArrayLike<number>): Float32Array {
  let finiteCount = 0;
  for (let i = 0; i < values.length; i++) {
    if (Number.isFinite(values[i])) finiteCount++;
  }

  const sortedValues = new Float32Array(finiteCount);
  let outputIndex = 0;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (!Number.isFinite(value)) continue;
    sortedValues[outputIndex] = value;
    outputIndex++;
  }

  sortedValues.sort();
  return sortedValues;
}

export function percentileFromSortedIntensities(
  sortedValues: ArrayLike<number>,
  percentile: number,
): number {
  if (sortedValues.length === 0) return Number.NaN;

  const clampedPercentile = Math.min(100, Math.max(0, percentile));
  const rank = (clampedPercentile / 100) * (sortedValues.length - 1);
  const lowIndex = Math.floor(rank);
  const highIndex = Math.ceil(rank);

  if (lowIndex === highIndex) return sortedValues[lowIndex];

  const fraction = rank - lowIndex;
  const lowValue = sortedValues[lowIndex];
  const highValue = sortedValues[highIndex];
  return lowValue + (highValue - lowValue) * fraction;
}

export function percentileIntensity(values: ArrayLike<number>, percentile: number): number {
  return percentileFromSortedIntensities(sortedFiniteIntensities(values), percentile);
}
