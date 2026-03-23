import { differenceInYears } from "date-fns";

export const asIsoDate = (value?: string | Date | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString().slice(0, 10);
};

export const yearsFromDate = (value?: string | Date | null): number | null => {
  if (!value) {
    return null;
  }

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return differenceInYears(new Date(), date);
};
