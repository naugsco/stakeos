import { ensureSqliteSpikeSchema, getSqliteSpikeDbPath, openSqliteSpikeDb } from "@/src/sqlite-spike/db";

const main = async () => {
  const db = openSqliteSpikeDb();
  try {
    ensureSqliteSpikeSchema(db);
    console.log(`SQLite schema ready at ${getSqliteSpikeDbPath()}`);
  } finally {
    db.close();
  }
};

main().catch((error) => {
  console.error("SQLite schema initialization failed", error);
  process.exit(1);
});
