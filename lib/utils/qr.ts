export function buildRecordUrl(healthDropId: string): string {
  return `/record/${encodeURIComponent(healthDropId)}`;
}

export function parseHealthIdFromScan(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes('/record/')) {
    return trimmed.split('/record/').pop() || trimmed;
  }
  return trimmed;
}

