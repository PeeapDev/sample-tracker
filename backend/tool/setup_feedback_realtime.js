/**
 * One-off provisioning against Supabase Postgres:
 *   1) add the 'sample_feedback' value to the notifications type enum
 *   2) enable Supabase Realtime on the notifications table
 *      (add to the supabase_realtime publication + REPLICA IDENTITY FULL)
 *
 * Idempotent — safe to re-run. Reads creds from backend/.env.
 *
 *   node tool/setup_feedback_realtime.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Minimal .env loader (avoid a dotenv dependency assumption).
const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2];
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}

async function main() {
  const client = new Client({
    host: process.env.SUPABASE_DB_HOST,
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432', 10),
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('connected to', process.env.SUPABASE_DB_HOST);

  // 1) Resolve the actual enum type backing notifications.type.
  const { rows: typeRows } = await client.query(
    `SELECT t.typname
       FROM pg_type t
       JOIN pg_attribute a ON a.atttypid = t.oid
       JOIN pg_class c     ON c.oid = a.attrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'notifications' AND a.attname = 'type' AND n.nspname = 'public'`,
  );
  if (!typeRows.length) throw new Error('could not find notifications.type enum type');
  const enumType = typeRows[0].typname;
  console.log('enum type:', enumType);

  // ALTER TYPE ... ADD VALUE must NOT be in a multi-statement/transaction block,
  // so it runs as its own standalone query.
  await client.query(
    `ALTER TYPE "${enumType}" ADD VALUE IF NOT EXISTS 'sample_feedback'`,
  );
  const { rows: vals } = await client.query(
    `SELECT enumlabel FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = $1 ORDER BY e.enumsortorder`,
    [enumType],
  );
  console.log('enum values now:', vals.map((r) => r.enumlabel).join(', '));

  // 2) Realtime: REPLICA IDENTITY FULL so UPDATE/DELETE payloads carry old row.
  await client.query('ALTER TABLE public.notifications REPLICA IDENTITY FULL');
  console.log('replica identity set to FULL');

  // Ensure the supabase_realtime publication exists, then add the table.
  const { rows: pub } = await client.query(
    `SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'`,
  );
  if (!pub.length) {
    await client.query('CREATE PUBLICATION supabase_realtime');
    console.log('created publication supabase_realtime');
  }
  const { rows: already } = await client.query(
    `SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'`,
  );
  if (already.length) {
    console.log('notifications already in supabase_realtime publication');
  } else {
    await client.query(
      'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications',
    );
    console.log('added public.notifications to supabase_realtime publication');
  }

  await client.end();
  console.log('done.');
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
