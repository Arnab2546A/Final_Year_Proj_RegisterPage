import { Pool, PoolConfig } from "pg";

function buildConfig(): PoolConfig {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
    };
  }

  const { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
  if (PGHOST && PGPORT && PGDATABASE && PGUSER && PGPASSWORD) {
    return {
      host: PGHOST,
      port: Number(PGPORT),
      database: PGDATABASE,
      user: PGUSER,
      password: PGPASSWORD,
    };
  }

  throw new Error(
    "Database env not set: provide DATABASE_URL or PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD"
  );
}

// Shared connection pool for the app
export const pool = new Pool({
  ...buildConfig(),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function ping() {
  const res = await pool.query("SELECT NOW() as now");
  return res.rows[0];
}


