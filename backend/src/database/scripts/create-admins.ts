import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Facility } from '../entities/facility.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums';

// Idempotent: ensures a few extra ADMIN accounts exist so the all-admin
// notification fan-out can be tested with more than one admin. Safe to re-run.

const EXTRA_ADMINS = [
  { email: 'admin2@nsrtms.gov.sl', firstName: 'Hawa', lastName: 'Conteh', phone: '+232-76-100010' },
  { email: 'admin3@nsrtms.gov.sl', firstName: 'Sahr', lastName: 'Mansaray', phone: '+232-76-100011' },
];
const PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

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
    entities: [Facility, User],
  };
}

async function run() {
  const ds = new DataSource(getDbConfig());
  await ds.initialize();
  const userRepo = ds.getRepository(User);
  const facilityRepo = ds.getRepository(Facility);
  const anyFacility = await facilityRepo.findOne({ where: {} });
  const password = await bcrypt.hash(PASSWORD, 12);

  for (const a of EXTRA_ADMINS) {
    const existing = await userRepo.findOne({ where: { email: a.email } });
    if (existing) {
      await userRepo.update(existing.id, {
        role: UserRole.ADMIN,
        isActive: true,
        isVerified: true,
        password,
      });
      console.log(`Updated existing admin: ${a.email}`);
      continue;
    }
    const staffId = `STF-${uuidv4().split('-')[0].toUpperCase().slice(0, 6)}`;
    await userRepo.save(
      userRepo.create({
        ...a,
        password,
        role: UserRole.ADMIN,
        facilityId: anyFacility?.id,
        staffId,
        qrCode: await QRCode.toDataURL(staffId),
        isActive: true,
        isVerified: true,
      }),
    );
    console.log(`Created admin: ${a.email} / ${PASSWORD}`);
  }

  const total = await userRepo.count({ where: { role: UserRole.ADMIN } });
  console.log(`---\nTotal admins now: ${total}`);
  await ds.destroy();
}

run().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
