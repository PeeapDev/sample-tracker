import 'dotenv/config';
import { DataSource, IsNull } from 'typeorm';
import * as QRCode from 'qrcode';
import { Sample } from '../entities/sample.entity';

// Seeded samples were inserted without a QR code (only the API create path
// generates one). This backfills a QR for every sample that's missing it, so
// the per-sample QR display, print, and batch thumbnails work everywhere.
function getDbConfig() {
  return {
    type: 'postgres' as const,
    host: process.env.SUPABASE_DB_HOST,
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
    username: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
    synchronize: true,
    ssl: { rejectUnauthorized: false },
  };
}

async function run() {
  const ds = new DataSource(getDbConfig());
  await ds.initialize();
  const repo = ds.getRepository(Sample);
  const missing = await repo.find({ where: { qrCode: IsNull() } });
  console.log(`Found ${missing.length} samples without a QR code. Generating…`);

  let done = 0;
  for (const s of missing) {
    const qrCode = await QRCode.toDataURL(s.sampleId);
    await repo.update(s.id, { qrCode });
    done++;
  }

  console.log(`Backfilled QR codes for ${done} samples.`);
  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
