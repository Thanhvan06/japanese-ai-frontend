/**
 * Fisher–Yates shuffle (copy).
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {unknown[]} fullList
 * @param {number | "all"} limit
 * @returns {unknown[]}
 */
export function takeRandomSubset(fullList, limit) {
  const list = Array.isArray(fullList) ? fullList : [];
  if (limit === "all" || limit == null) {
    return [...list];
  }
  const cap = Number(limit);
  if (!cap || cap < 1) {
    return [];
  }
  const n = Math.min(cap, list.length);
  if (n >= list.length) {
    return shuffleArray(list);
  }
  return shuffleArray(list).slice(0, n);
}

/**
 * @param {number | null} totalSeconds
 * @returns {string}
 */
export function formatCountdown(totalSeconds) {
  if (totalSeconds == null || totalSeconds < 0) {
    return "0:00";
  }
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
