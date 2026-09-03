const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Human-friendly age of a timestamp: "just now", "5 min ago", "3 hours ago", "yesterday",
 * "4 days ago", then a short date once it is more than a week old.
 */
export function formatRelativeTime(timestamp: string, now = new Date()): string {
  const elapsed = now.getTime() - new Date(timestamp).getTime();

  if (elapsed < MINUTE) {
    return 'just now';
  }

  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)} min ago`;
  }

  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);

    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  if (elapsed < 2 * DAY) {
    return 'yesterday';
  }

  if (elapsed < 7 * DAY) {
    return `${Math.floor(elapsed / DAY)} days ago`;
  }

  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
