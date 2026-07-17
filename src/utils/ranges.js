import { toYmd } from "./date";

export function monthCurrent() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { desde: toYmd(start), hasta: toYmd(end) };
}

export function monthPrevious() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { desde: toYmd(start), hasta: toYmd(end) };
}

export function lastNDays(n = 30) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - n);
  return { desde: toYmd(start), hasta: toYmd(end) };
}