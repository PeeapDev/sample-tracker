import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Facility } from '../entities/facility.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums';

// Idempotent: ensures a hub facility + a HUB_OFFICER user exist so the whole
// pickup -> hub -> lab flow can be tested end to end. Safe to re-run; it never
// duplicates and never wipes existing data.

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

const HUB_EMAIL = process.env.HUB_EMAIL || 'hub@nsrtms.gov.sl';
const HUB_PASSWORD = process.env.HUB_PASSWORD || 'password123';
const HUB_PIN = process.env.HUB_PIN || '1234';

function generateStaffId(): string {
  const rand = uuidv4().split('-')[0].toUpperCase().slice(0, 6);
  return `STF-${rand}`;
}

async function run() {
  const ds = new DataSource(getDbConfig());
  await ds.initialize();
  console.log('Connected to database');

  const facilityRepo = ds.getRepository(Facility);
  const userRepo = ds.getRepository(User);

  // 1. Find (or create) a hub facility to attach the officer to.
  let hub = await facilityRepo.findOne({ where: { type: 'hub' } });
  if (!hub) {
    hub = await facilityRepo.save(
      facilityRepo.create({
        code: 'HUB-001',
        name: 'Freetown Regional Hub',
        type: 'hub',
        district: 'Western Area Urban',
        chiefdom: 'Freetown',
        address: 'Siaka Stevens Street',
        phone: '+232-76-000002',
        latitude: 8.4697,
        longitude: -13.2657,
      }),
    );
    console.log(`Created hub facility: ${hub.code} - ${hub.name}`);
  } else {
    console.log(`Using existing hub facility: ${hub.code} - ${hub.name}`);
  }

  // 2. Find (or create) the hub officer. Pull the badge columns explicitly
  //    since staffId/qrCode are select:false on the entity.
  let user = await userRepo
    .createQueryBuilder('user')
    .addSelect(['user.qrCode'])
    .where('user.email = :email', { email: HUB_EMAIL })
    .getOne();

  const password = await bcrypt.hash(HUB_PASSWORD, 12);
  const pin = await bcrypt.hash(HUB_PIN, 10);

  if (!user) {
    const staffId = generateStaffId();
    const qrCode = await QRCode.toDataURL(staffId);
    user = await userRepo.save(
      userRepo.create({
        email: HUB_EMAIL,
        phone: '+232-76-100004',
        firstName: 'Fatmata',
        lastName: 'Bangura',
        password,
        pin,
        role: UserRole.HUB_OFFICER,
        facilityId: hub.id,
        staffId,
        qrCode,
        isActive: true,
        isVerified: true,
      }),
    );
    console.log(`Created hub officer: ${HUB_EMAIL}`);
  } else {
    // Re-run: make sure the account is usable for testing (right role, active,
    // attached to the hub, has a fresh known password/PIN and a staff badge).
    const patch: Partial<User> = {
      role: UserRole.HUB_OFFICER,
      facilityId: hub.id,
      isActive: true,
      isVerified: true,
      password,
      pin,
    };
    if (!user.staffId) {
      patch.staffId = generateStaffId();
      patch.qrCode = await QRCode.toDataURL(patch.staffId);
    }
    await userRepo.update(user.id, patch);
    user = (await userRepo
      .createQueryBuilder('user')
      .addSelect(['user.qrCode'])
      .where('user.id = :id', { id: user.id })
      .getOne())!;
    console.log(`Updated existing hub officer: ${HUB_EMAIL}`);
  }

  console.log('---');
  console.log('Hub officer ready:');
  console.log(`  Email:    ${user.email}`);
  console.log(`  Password: ${HUB_PASSWORD}`);
  console.log(`  PIN:      ${HUB_PIN}`);
  console.log(`  Role:     ${user.role}`);
  console.log(`  Facility: ${hub.code} - ${hub.name}`);
  console.log(`  Staff ID: ${user.staffId}`);
  console.log(`  User ID:  ${user.id}`);
  console.log('---');
  console.log(
    'Print the staff QR from the admin app (ID Cards page) or open the data URL below:',
  );
  console.log(user.qrCode);

  await ds.destroy();
}

run().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
