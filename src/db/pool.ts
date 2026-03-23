import { Pool, type QueryResultRow } from "pg";
import { env } from "@/src/config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 12
});

export const query = <T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) =>
  pool.query<T>(text, params);
