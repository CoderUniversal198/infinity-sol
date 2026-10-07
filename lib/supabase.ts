import 'server-only';
import { Pool, types, type QueryResultRow } from 'pg';
import { readFileSync } from 'node:fs';
import { AppError } from './errors';

// Direct server-side connection to Supabase PostgreSQL. No public API key is used.
types.setTypeParser(1082, value => value);
const globalDatabase = globalThis as unknown as { novaWorksPool?: Pool };
function getPool(): Pool {
  if (globalDatabase.novaWorksPool) return globalDatabase.novaWorksPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new AppError(503, 'Configure DATABASE_URL in .env.local and restart the app.');
  let certificate: string | undefined;
  if (process.env.DATABASE_SSL_CA_FILE) {
    try { certificate = readFileSync(process.env.DATABASE_SSL_CA_FILE, 'utf8'); }
    catch { throw new AppError(503, 'The database certificate file could not be read. Check DATABASE_SSL_CA_FILE.'); }
  }
  globalDatabase.novaWorksPool = new Pool({
    connectionString,
    ssl: certificate ? { rejectUnauthorized: true, ca: certificate } : { rejectUnauthorized: false },
    max: 1, idleTimeoutMillis: 20000, connectionTimeoutMillis: 10000,
    statement_timeout: 12000, application_name: 'novaworks-crm'
  });
  globalDatabase.novaWorksPool.on('error', () => console.error('An idle database connection closed.'));
  return globalDatabase.novaWorksPool;
}
export async function databaseQuery<T extends QueryResultRow = QueryResultRow>(sql: string, parameters: unknown[] = []): Promise<T[]> {
  try { return (await getPool().query<T>(sql, parameters)).rows; }
  catch (error) {
    if (error instanceof AppError) throw error;
    const code = (error as { code?: string }).code;
    if (['ENETUNREACH', 'EHOSTUNREACH', 'ENOTFOUND', 'ETIMEDOUT'].includes(code ?? '')) throw new AppError(503, 'Database connection unavailable. If your network has no IPv6, replace DATABASE_URL with the Session pooler string from Supabase Connect.');
    if (['SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(code ?? '')) throw new AppError(503, 'Download the database root certificate from Supabase Database settings, set DATABASE_SSL_CA_FILE to its path, and restart the app.');
    if (code === '28P01') throw new AppError(503, 'The database password was rejected. Check DATABASE_URL and URL-encode reserved password characters.');
    if (code === '42P01' || code === '42883') throw new AppError(503, 'Database setup is incomplete. Run the entire supabase/schema.sql file in Supabase SQL Editor.');
    throw new AppError(503, 'The database request failed. Check the connection and schema, then try again.');
  }
}
