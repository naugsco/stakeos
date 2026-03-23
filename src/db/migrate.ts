import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "@/src/db/pool";

const run = async () => {
  const schemaPath = resolve(process.cwd(), "src/db/schema.sql");
  const sql = await readFile(schemaPath, "utf8");
  await pool.query(sql);
  await pool.end();
  console.log("Database schema applied.");
};

run().catch(async (error) => {
  console.error("Migration failed", error);
  await pool.end();
  process.exit(1);
});
