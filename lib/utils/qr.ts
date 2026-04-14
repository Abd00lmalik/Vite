export function buildRecordUrl(healthDropId: string): string {
  return `/record/${encodeURIComponent(healthDropId)}`;
}

export function parseHealthIdFromScan(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.includes('/record/')) {
      const last = parsed.pathname.split('/record/').pop() ?? '';
      return decodeURIComponent(last.replace(/\/+$/, ''));
    }
  } catch {
    // Non-URL value, continue with fallback parsing.
  }

  if (trimmed.includes('/record/')) {
    return decodeURIComponent((trimmed.split('/record/').pop() || trimmed).split('?')[0]);
  }
  return trimmed;
}

