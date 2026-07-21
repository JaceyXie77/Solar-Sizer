// ============================================================
// LOAD ANALYSIS — Input aggregation and sizing math
// ============================================================

export function getRunningItems(items) {
  return items.filter(function(item) { return item.running; });
}

export function getNonRunningItems(items) {
  return items.filter(function(item) { return !item.running; });
}

export function getLargestOptionalLoad(items) {
  let maxLoad = 0;
  let maxItem = null;

  for (const item of getNonRunningItems(items)) {
    const totalLoad = item.power * item.qty;
    if (totalLoad > maxLoad) {
      maxLoad = totalLoad;
      maxItem = item;
    }
  }

  return { maxLoad, maxItem };
}

export function getSimultaneousItems(items) {
  const runningItems = getRunningItems(items);
  const { maxItem } = getLargestOptionalLoad(items);
  if (!maxItem) return runningItems;
  return [...runningItems, maxItem];
}

export function calculateTotalRunningPower(items) {
  const runningItems = getRunningItems(items);
  const { maxLoad } = getLargestOptionalLoad(items);
  return runningItems.reduce(function(sum, item) { return sum + item.power * item.qty; }, 0) + maxLoad;
}

export function calculatePeakPower(items) {
  const simultaneousItems = getSimultaneousItems(items);
  const hasSurgeItem = simultaneousItems.some(function(item) { return item.surge; });

  if (!hasSurgeItem) {
    return calculateTotalRunningPower(items) * 1.2;
  }

  const surgeLoad = simultaneousItems
    .filter(function(item) { return item.surge; })
    .reduce(function(sum, item) { return sum + item.power * item.qty; }, 0);

  const nonSurgeLoad = simultaneousItems
    .filter(function(item) { return !item.surge; })
    .reduce(function(sum, item) { return sum + item.power * item.qty; }, 0);

  return surgeLoad * 2 + nonSurgeLoad * 1.2;
}

export function calculateDailyEnergyWh(items) {
  return items.reduce(function(sum, item) {
    return sum + item.power * item.qty * item.hoursPerDay;
  }, 0);
}
