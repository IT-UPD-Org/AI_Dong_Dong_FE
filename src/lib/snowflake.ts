/** 2026-01-01T00:00:00Z — must match SINCE_EPOCH in the backend's snowflake.py. */
const SNOWFLAKE_EPOCH_MS = 1767200400 * 1000;

/**
 * Recover the creation time embedded in a backend Snowflake ID.
 *
 * IDs are laid out as `flag << 58 | relative_ms << 8 | random`. BigInt is
 * required because the IDs exceed Number.MAX_SAFE_INTEGER.
 */
export function snowflakeDate(id: string): Date | null {
  try {
    const relativeMs = (BigInt(id) >> 8n) & ((1n << 50n) - 1n);
    return new Date(SNOWFLAKE_EPOCH_MS + Number(relativeMs));
  } catch {
    return null;
  }
}

export function formatSnowflakeDate(id: string): string | null {
  const date = snowflakeDate(id);
  if (!date) return null;
  return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
