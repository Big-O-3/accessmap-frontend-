// Format an ISO timestamp as a short relative string ("2 hrs ago").
// Kept tiny and dependency-free.
export function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  const units = [
    ["yr", 31536000],
    ["mo", 2592000],
    ["day", 86400],
    ["hr", 3600],
    ["min", 60],
  ];
  for (const [label, secs] of units) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n} ${label}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}
