import { registerAs } from '@nestjs/config';
import { Batch } from '../database/entities/batch.entity';
import { Dispatch } from '../database/entities/dispatch.entity';
import { EventLog } from '../database/entities/event-log.entity';
import { Facility } from '../database/entities/facility.entity';
import { Notification } from '../database/entities/notification.entity';
import { RolePermission } from '../database/entities/role-permission.entity';
import { Sample } from '../database/entities/sample.entity';
import { User } from '../database/entities/user.entity';

// Explicit entity list (not a glob): the serverless build bundles the app into a
// single file, so `__dirname`-based globs find nothing at runtime.
const entities = [
  Batch,
  Dispatch,
  EventLog,
  Facility,
  Notification,
  RolePermission,
  Sample,
  User,
];

// We connect through Supabase's Session pooler (port 5432) because TypeORM's
// prepared statements break on the Transaction pooler (6543). In serverless,
// each warm instance keeps its own pool, so cap it at one connection to avoid
// exhausting the session pooler as Vercel scales instances out.
const extra = process.env.VERCEL ? { max: 1 } : {};

export default registerAs('database', () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const projectId = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
    return {
      type: 'postgres',
      host: process.env.SUPABASE_DB_HOST || `db.${projectId}.supabase.co`,
      port: parseInt(process.env.SUPABASE_DB_PORT || '6543', 10),
      username: process.env.SUPABASE_DB_USER || 'postgres',
      password: process.env.SUPABASE_DB_PASSWORD || supabaseKey,
      database: process.env.SUPABASE_DB_NAME || 'postgres',
      entities,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      ssl: { rejectUnauthorized: false },
      extra,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'nsrtms',
    password: process.env.DB_PASSWORD || 'nsrtms_secret',
    database: process.env.DB_NAME || 'nsrtms',
    entities,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    extra,
  };
});
