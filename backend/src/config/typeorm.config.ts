import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

// The TypeORM CLI (migration:generate / migration:run) loads THIS file as its
// DataSource. It must see the same connection vars as the Nest app — but the
// app reads them through @nestjs/config at runtime, which the CLI doesn't boot.
// Rather than add a dotenv dependency, parse .env here and populate process.env
// for any key not already set by the real environment (prod injects its own).
try {
  const raw = readFileSync(join(process.cwd(), '.env'), 'utf8');
  for (const line of raw.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
} catch {
  /* no .env file — rely on the ambient environment */
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mirror src/config/database.config.ts so migrations target the same database.
// Unlike the bundled serverless runtime, the CLI runs through ts-node, so a
// glob for entities/migrations resolves fine here.
const common = {
  type: 'postgres' as const,
  entities: ['src/database/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
};

const dataSource =
  supabaseUrl && supabaseKey
    ? new DataSource({
        ...common,
        host:
          process.env.SUPABASE_DB_HOST ||
          `db.${supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1]}.supabase.co`,
        port: parseInt(process.env.SUPABASE_DB_PORT || '6543', 10),
        username: process.env.SUPABASE_DB_USER || 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD || supabaseKey,
        database: process.env.SUPABASE_DB_NAME || 'postgres',
        ssl: { rejectUnauthorized: false },
      })
    : new DataSource({
        ...common,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'nsrtms',
        password: process.env.DB_PASSWORD || 'nsrtms_secret',
        database: process.env.DB_NAME || 'nsrtms',
        ssl:
          process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      });

export default dataSource;
