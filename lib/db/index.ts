import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update, which can quickly exhaust the database's connection limit.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Supabase Transaction Pooler (port 6543) avoids the 15-connection session mode limit on port 5432
const rawUrl = process.env.DATABASE_URL ?? "";
const dbUrl = rawUrl ? rawUrl.replace(":5432/", ":6543/").replace(":5432", ":6543") : "postgresql://postgres:postgres@localhost:5432/postgres";
const conn = globalForDb.conn ?? postgres(dbUrl, { prepare: false });
if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
