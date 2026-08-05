const UNIT_SECONDS = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
} as const;

type DurationUnit = keyof typeof UNIT_SECONDS;

const DURATION_PART = /(\d+)\s*([smhd])\s*/gi;

/**
 * Parses a compact duration string such as "2h30m" into seconds.
 *
 * Supported units are seconds (s), minutes (m), hours (h), and days (d).
 * Duration parts may be separated by whitespace and units are case-insensitive.
 */
export function parseDuration(str: string): number {
  const input = str.trim();
  if (!input) {
    throw new Error('duration must not be empty');
  }

  let totalSeconds = 0;
  let cursor = 0;
  let hasPart = false;

  for (const match of input.matchAll(DURATION_PART)) {
    if (match.index !== cursor) {
      throw new Error(`invalid duration: ${str}`);
    }

    const [, amount, rawUnit] = match;
    const unit = rawUnit.toLowerCase() as DurationUnit;
    totalSeconds += Number(amount) * UNIT_SECONDS[unit];
    cursor = match.index + match[0].length;
    hasPart = true;
  }

  if (!hasPart || cursor !== input.length) {
    throw new Error(`invalid duration: ${str}`);
  }

  return totalSeconds;
}
