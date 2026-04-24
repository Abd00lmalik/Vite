const shownMessages = new Map<string, number>();
const DEDUP_WINDOW_MS = 5000;

export function toastErrorOnce(message: string, toastFn: (msg: string) => void): void {
  const now = Date.now();
  const lastShown = shownMessages.get(message);
  if (lastShown && now - lastShown < DEDUP_WINDOW_MS) return;
  shownMessages.set(message, now);
  toastFn(message);
}
