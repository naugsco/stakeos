export const normalizeWhitespace = (value?: string | null): string =>
  (value ?? "").replace(/\s+/g, " ").trim();

export const asBoolean = (value?: string | boolean | null): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase().trim();
  if (["yes", "true", "1", "y"].includes(normalized)) {
    return true;
  }
  if (["no", "false", "0", "n"].includes(normalized)) {
    return false;
  }
  return undefined;
};
