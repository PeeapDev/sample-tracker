import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { NotificationChannel, NotificationType } from '../enums';

// One-off: drop a test notification into the bell so we can confirm the feature
// works end-to-end. Targets the user passed as TEST_NOTIFY_EMAIL (defaults to
// the project owner); falls back to a network-wide broadcast that every admin
// bell shows when that user can't be found.
const TARGET_EMAIL = process.env.TEST_NOTIFY_EMAIL || 'pay.peeap@gmail.com';

function getDbConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const projectId = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
    return {
      type: 'postgres' as const,
      host: process.env.SUPABASE_DB_HOST || `db.${projectId}.supabase.co`,
      port: parseInt(process.env.SUPABASE_DB_PORT || '6543'),
      username: process.env.SUPABASE_DB_USER || 'postgres',
      password: process.env.SUPABASE_DB_PASSWORD || supabaseKey,
      database: process.env.SUPABASE_DB_NAME || 'postgres',
      entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    };
  }

  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'nsrtms',
    password: process.env.DB_PASSWORD || 'nsrtms_secret',
    database: process.env.DB_NAME || 'nsrtms',
    entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
    synchronize: false,
  };
}

async function main() {
  const ds = new DataSource(getDbConfig());
  await ds.initialize();
  console.log('Connected to database');

  const user = await ds
    .getRepository(User)
    .findOne({ where: { email: TARGET_EMAIL } });

  const notifications = ds.getRepository(Notification);
  const saved = await notifications.save(
    notifications.create({
      type: NotificationType.SAMPLE_REGISTERED,
      channel: NotificationChannel.PUSH,
      title: 'Test notification',
      message: 'If you can see this, notifications are working. 🎉',
      userId: user?.id, // undefined → broadcast (admins see it)
    }),
  );

  console.log(
    user
      ? `Sent test notification ${saved.id} to ${TARGET_EMAIL} (userId=${user.id})`
      : `User ${TARGET_EMAIL} not found — sent broadcast notification ${saved.id} (visible to all admins)`,
  );

  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
