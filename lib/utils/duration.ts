/**
 * Utility functions for parsing episode duration strings and computing exact watch time metrics.
 */

export function parseDurationMinutes(duration?: string | number | null): number {
  if (!duration) return 24;
  if (typeof duration === 'number') return duration > 0 ? duration : 24;

  const str = duration.toString().toLowerCase().trim();

  // Check for hours and minutes (e.g. "1 hr 25 min" or "1 hr")
  const hrMatch = str.match(/(\d+)\s*(?:hr|hour)/);
  const minMatch = str.match(/(\d+)\s*(?:min|minute)/);

  let totalMins = 0;
  if (hrMatch) {
    totalMins += parseInt(hrMatch[1], 10) * 60;
  }
  if (minMatch) {
    totalMins += parseInt(minMatch[1], 10);
  }

  if (totalMins > 0) return totalMins;

  // Fallback to standalone digit match (e.g. "24 min per ep" -> 24)
  const numMatch = str.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    return num > 0 ? num : 24;
  }

  return 24;
}

export function formatDetailedWatchTimeFromMinutes(totalMinutes: number) {
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingMinsAfterDays = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingMinsAfterDays / 60);
  const mins = remainingMinsAfterDays % 60;
  const formattedHours = (totalMinutes / 60).toFixed(1);

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h ${mins}m`;
  } else if (hours > 0) {
    formatted = `${hours}h ${mins}m`;
  } else {
    formatted = `${mins}m`;
  }

  return {
    totalMinutes,
    formattedHours,
    days,
    hours,
    mins,
    formatted,
  };
}
