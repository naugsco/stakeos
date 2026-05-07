import { differenceInYears } from "date-fns";

const monthMap: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11
};

const validDate = (date: Date) => (Number.isNaN(date.getTime()) ? null : date);

export const parseStakeDate = (value?: string | Date | null): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return validDate(value);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return validDate(new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  }

  const dayMonthYear = trimmed.match(/^(\d{1,2})[\s/-]+([A-Za-z]{3,9})[\s,/-]+(\d{4})$/);
  if (dayMonthYear) {
    const month = monthMap[dayMonthYear[2].toLowerCase()];
    if (month !== undefined) {
      return validDate(new Date(Number(dayMonthYear[3]), month, Number(dayMonthYear[1])));
    }
  }

  const monthDayYear = trimmed.match(/^([A-Za-z]{3,9})[\s/-]+(\d{1,2})(?:st|nd|rd|th)?[,]?[\s/-]+(\d{4})$/i);
  if (monthDayYear) {
    const month = monthMap[monthDayYear[1].toLowerCase()];
    if (month !== undefined) {
      return validDate(new Date(Number(monthDayYear[3]), month, Number(monthDayYear[2])));
    }
  }

  return validDate(new Date(trimmed));
};

export const compareStakeDates = (
  left?: string | Date | null,
  right?: string | Date | null,
  direction: "asc" | "desc" = "asc"
) => {
  const leftDate = parseStakeDate(left);
  const rightDate = parseStakeDate(right);

  if (leftDate && rightDate) {
    const result = leftDate.getTime() - rightDate.getTime();
    return direction === "asc" ? result : -result;
  }
  if (leftDate) {
    return direction === "asc" ? -1 : 1;
  }
  if (rightDate) {
    return direction === "asc" ? 1 : -1;
  }
  return String(left ?? "").localeCompare(String(right ?? ""), undefined, { sensitivity: "base" });
};

export const isOnOrAfterDate = (value: string | Date | null | undefined, threshold: Date) => {
  const date = parseStakeDate(value);
  return Boolean(date && date >= threshold);
};

export const formatStakeMonthKey = (value?: string | Date | null) => {
  const date = parseStakeDate(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : null;
};

export const asIsoDate = (value?: string | Date | null): string | undefined => {
  const date = parseStakeDate(value);

  return date ? date.toISOString().slice(0, 10) : undefined;
};

export const yearsFromDate = (value?: string | Date | null): number | null => {
  const date = parseStakeDate(value);

  return date ? differenceInYears(new Date(), date) : null;
};
