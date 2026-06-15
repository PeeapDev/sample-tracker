import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Sample } from '../entities/sample.entity';
import { EventLog } from '../entities/event-log.entity';
import { User } from '../entities/user.entity';
import { Facility } from '../entities/facility.entity';
import { SampleStatus } from '../enums';

function getDbConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
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
  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'nsrtms',
    password: process.env.DB_PASSWORD || 'nsrtms_secret',
    database: process.env.DB_NAME || 'nsrtms',
    entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
    synchronize: true,
  };
}

const PROGRAMS = ['HIV', 'Tuberculosis', 'Malaria', 'COVID-19', 'Hepatitis', 'Cholera'];
const TYPES = ['Blood', 'Sputum', 'Stool', 'Urine', 'Nasal Swab'];
const VILLAGES = ['Waterloo', 'Kissy', 'Makeni', 'Kenema', 'Port Loko', 'Bo', 'Lunsar', 'Magburaka'];
const GENDERS = ['Male', 'Female'];

// Weighted status pool (more completed, a few lost).
const STATUS_POOL: SampleStatus[] = [
  ...Array(9).fill(SampleStatus.COMPLETED),
  ...Array(3).fill(SampleStatus.IN_TRANSIT),
  ...Array(2).fill(SampleStatus.LAB_RECEIVED),
  ...Array(2).fill(SampleStatus.HUB_RECEIVED),
  ...Array(2).fill(SampleStatus.PICKED_UP),
  ...Array(3).fill(SampleStatus.COLLECTED),
  ...Array(1).fill(SampleStatus.ANALYSIS_QUEUE),
  ...Array(1).fill(SampleStatus.LOST),
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rid = (n: number) =>
  Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

async function seed() {
  const ds = new DataSource(getDbConfig());
  await ds.initialize();
  console.log('Connected. Seeding sample data...');

  const sampleRepo = ds.getRepository(Sample);
  const eventRepo = ds.getRepository(EventLog);
  const users = await ds.getRepository(User).find();
  const facilities = await ds.getRepository(Facility).find();

  const collectors = users.filter((u) => u.role === 'collector');
  const collector = collectors[0] ?? users[0];
  const healthFacilities = facilities.filter((f) => (f as any).type === 'health_facility');

  const COUNT = 64;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const created: { id: string; status: SampleStatus; createdAt: Date }[] = [];

  for (let i = 0; i < COUNT; i++) {
    const status = pick(STATUS_POOL);
    // Spread across the last 14 days, biased toward recent days.
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.5) * 14);
    const createdAt = new Date(now - daysAgo * day - Math.floor(Math.random() * day));
    const facility = pick(healthFacilities.length ? healthFacilities : facilities);

    const sample = sampleRepo.create({
      sampleId: `NSR-${rid(6)}-${rid(4)}`,
      sampleType: pick(TYPES),
      status,
      diseaseProgram: pick(PROGRAMS),
      quantity: 1 + Math.floor(Math.random() * 3),
      village: pick(VILLAGES),
      patientAge: 1 + Math.floor(Math.random() * 80),
      patientGender: pick(GENDERS),
      collectedById: collector?.id,
      facilityId: facility?.id,
      collectedAt: createdAt,
    });
    const saved = await sampleRepo.save(sample);
    // CreateDateColumn defaults to now(); backdate it for the volume chart.
    await ds.query('UPDATE samples SET "createdAt" = $1 WHERE id = $2', [createdAt, saved.id]);
    created.push({ id: saved.id, status, createdAt });
  }

  // Event logs for the 30 most recent samples → powers "Recent Activity".
  const recent = [...created].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 30);
  for (const s of recent) {
    const ts = new Date(Math.min(now - Math.floor(Math.random() * 6 * 60 * 60 * 1000), now));
    const log = eventRepo.create({
      sampleId: s.id,
      event: s.status,
      description: `Sample marked ${s.status}`,
      actorId: collector?.id,
    });
    const savedLog = await eventRepo.save(log);
    await ds.query('UPDATE event_logs SET "timestamp" = $1 WHERE id = $2', [ts, savedLog.id]);
  }

  const counts = created.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});
  console.log(`Inserted ${COUNT} samples + ${recent.length} activity events`);
  console.log('By status:', counts);
  await ds.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
