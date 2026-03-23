import { createHash } from "node:crypto";

export const stableHash = (input: string) =>
  createHash("sha1").update(input).digest("hex").slice(0, 24);
