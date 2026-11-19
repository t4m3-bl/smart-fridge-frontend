const MS_PER_DAY = 86_400_000;

const RU_MONTHS_FULL = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

const RU_MONTHS_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
] as const;

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function daysBetween(from: Date, to: Date): number {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());

  return Math.round((toUtc - fromUtc) / MS_PER_DAY);
}

export function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${RU_MONTHS_FULL[date.getMonth()]}`;
}

export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${RU_MONTHS_SHORT[date.getMonth()]}`;
}

export function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateOnly(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? value : toDateInputValue(parsed);
}

export function parseDateValue(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const dateOnly = fromDateInputValue(toDateOnly(value));

  if (dateOnly) {
    return dateOnly;
  }

  const fallback = new Date(value);

  return Number.isNaN(fallback.getTime()) ? null : startOfLocalDay(fallback);
}

