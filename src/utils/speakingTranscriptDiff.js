/**
 * Build segments of the user's transcript: matched ref chars vs errors.
 *
 * @param {string} reference
 * @param {string} transcribed
 * @returns {{ segments: { text: string; match: boolean }[] }}
 */
export function buildTranscriptDiffSegments(reference, transcribed) {
  const ref = Array.from(String(reference ?? "").trim());
  const usr = Array.from(String(transcribed ?? "").trim());

  if (usr.length === 0) {
    return { segments: [] };
  }

  if (ref.length === 0) {
    return {
      segments: [{ text: usr.join(""), match: false }],
    };
  }

  const m = ref.length;
  const n = usr.length;
  const dp = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sub = ref[i - 1] === usr[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + sub,
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1
      );
    }
  }

  const userMatch = Array(n).fill(false);
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      ref[i - 1] === usr[j - 1] &&
      dp[i][j] === dp[i - 1][j - 1]
    ) {
      userMatch[j - 1] = true;
      i -= 1;
      j -= 1;
    } else if (
      i > 0 &&
      j > 0 &&
      dp[i][j] === dp[i - 1][j - 1] + 1
    ) {
      userMatch[j - 1] = false;
      i -= 1;
      j -= 1;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      userMatch[j - 1] = false;
      j -= 1;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      i -= 1;
    } else {
      break;
    }
  }

  const segments = [];
  let buf = "";
  let state = userMatch[0];

  for (let k = 0; k < n; k++) {
    if (k > 0 && userMatch[k] !== state) {
      segments.push({ text: buf, match: state });
      buf = usr[k];
      state = userMatch[k];
    } else {
      buf += usr[k];
    }
  }
  if (buf.length > 0) {
    segments.push({ text: buf, match: state });
  }

  return { segments };
}
