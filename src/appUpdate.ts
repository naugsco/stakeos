import packageJson from "@/package.json";

const parseVersion = (value: string) =>
  value
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

export const getCurrentAppVersion = () => packageJson.version;

export const isVersionNewer = (candidate: string, current: string) => {
  const left = parseVersion(candidate);
  const right = parseVersion(current);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    if (a > b) {
      return true;
    }
    if (a < b) {
      return false;
    }
  }

  return false;
};
