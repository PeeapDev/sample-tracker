import { registerAs } from '@nestjs/config';

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
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      ssl: { rejectUnauthorized: false },
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'nsrtms',
    password: process.env.DB_PASSWORD || 'nsrtms_secret',
    database: process.env.DB_NAME || 'nsrtms',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
});
