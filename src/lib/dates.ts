/** Date helpers — all day-granularity logic uses local calendar days. */

export const dayKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const dayKeyOf = (iso: string): string => dayKey(new Date(iso));

export const isToday = (iso: string | null): boolean =>
  iso != null && dayKeyOf(iso) === dayKey();

export const isYesterday = (iso: string | null): boolean => {
  if (iso == null) return false;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return dayKeyOf(iso) === dayKey(y);
};

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatDay = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

/** Days from today until a yyyy-mm-dd deadline; negative if past. */
export const daysUntil = (deadline: string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const [y, m, d] = deadline.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
};
