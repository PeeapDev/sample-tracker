// One-off migration runner: applies a .sql file against the configured Supabase
// Postgres using the same env the app uses. Usage:
//   node scripts/apply-migration.js migrations/<file>.sql
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client } = require('pg');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/apply-migration.js <path-to-sql>');
  process.exit(1);
}
const sql = fs.readFileSync(path.resolve(file), 'utf8');

const projectId = (process.env.SUPABASE_URL || '').match(/https:\/\/(.+)\.supabase\.co/)?.[1];
const client = new Client({
  host: process.env.SUPABASE_DB_HOST || (projectId ? `db.${projectId}.supabase.co` : process.env.DB_HOST),
  port: parseInt(process.env.SUPABASE_DB_PORT || process.env.DB_PORT || '6543', 10),
  user: process.env.SUPABASE_DB_USER || process.env.DB_USERNAME || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME || process.env.DB_NAME || 'postgres',
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await client.connect();
  await client.query(sql);
  console.log('Migration applied OK:', file);
  await client.end();
})().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
