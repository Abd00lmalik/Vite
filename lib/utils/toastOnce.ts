const shownMessages = new Map<string, number>();
const DEDUP_WINDOW_MS = 5000;

export function toastErrorOnce(
  message: string,
  toastFn: (msg: string) => unknown
): string | undefined {
  const now = Date.now();
  const lastShown = shownMessages.get(message);
  if (lastShown && now - lastShown < DEDUP_WINDOW_MS) return undefined;
  shownMessages.set(message, now);
  const toastId = toastFn(message);
  return typeof toastId === 'string' ? toastId : undefined;
}
