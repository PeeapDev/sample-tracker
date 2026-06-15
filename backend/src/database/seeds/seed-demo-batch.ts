import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Sample } from '../entities/sample.entity';
import { EventLog } from '../entities/event-log.entity';
import { User } from '../entities/user.entity';
import { Facility } from '../entities/facility.entity';
import { SampleStatus } from '../enums';

// Inserts a small set of fresh COLLECTED samples so the batch demo's
// "scan box -> advance all" shows a clean N/N advance with zero skips.
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

const PROGRAMS = ['HIV', 'Tuberculosis', 'Malaria', 'COVID-19', 'Hepatitis'];
const TYPES = ['Blood', 'Sputum', 'Stool', 'Nasal Swab'];
const VILLAGES = ['Waterloo', 'Kissy', 'Makeni', 'Kenema', 'Port Loko', 'Bo'];
const GENDERS = ['Male', 'Female'];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rid = (n: number) =>
  Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

async function seed() {
  const ds = new DataSource(getDbConfig());
  await ds.initialize();

  const sampleRepo = ds.getRepository(Sample);
  const eventRepo = ds.getRepository(EventLog);
  const users = await ds.getRepository(User).find();
  const facilities = await ds.getRepository(Facility).find();
  const collector = users.find((u) => u.role === 'collector') ?? users[0];
  const healthFacilities = facilities.filter((f) => (f as any).type === 'health_facility');

  const COUNT = 8;
  const created: string[] = [];

  for (let i = 0; i < COUNT; i++) {
    const facility = pick(healthFacilities.length ? healthFacilities : facilities);
    const sample = await sampleRepo.save(
      sampleRepo.create({
        sampleId: `NSR-${rid(6)}-${rid(4)}`,
        sampleType: pick(TYPES),
        status: SampleStatus.COLLECTED,
        diseaseProgram: pick(PROGRAMS),
        quantity: 1 + Math.floor(Math.random() * 3),
        village: pick(VILLAGES),
        patientAge: 1 + Math.floor(Math.random() * 80),
        patientGender: pick(GENDERS),
        collectedById: collector?.id,
        facilityId: facility?.id,
        collectedAt: new Date(),
      }),
    );
    await eventRepo.save(
      eventRepo.create({
        sampleId: sample.id,
        event: SampleStatus.COLLECTED,
        description: 'Sample collected (demo batch)',
        actorId: collector?.id,
        facilityId: facility?.id,
      }),
    );
    created.push(sample.sampleId);
  }

  console.log(`Inserted ${COUNT} fresh COLLECTED samples for the batch demo:`);
  console.log(created.join(', '));
  await ds.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
