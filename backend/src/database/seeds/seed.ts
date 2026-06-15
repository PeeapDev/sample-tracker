import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Facility } from '../entities/facility.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums';

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
    entities: [Facility, User],
    synchronize: true,
  };
}

async function seed() {
  const ds = new DataSource(getDbConfig());

  await ds.initialize();
  console.log('Connected to database');

  const facilityRepo = ds.getRepository(Facility);
  const userRepo = ds.getRepository(User);

  const facilities = await facilityRepo.save([
    {
      code: 'FAC-001',
      name: 'Freetown Central Hospital',
      type: 'health_facility',
      district: 'Western Area Urban',
      chiefdom: 'Freetown',
      address: 'Wallace Johnson Street',
      phone: '+232-76-000001',
      latitude: 8.4657,
      longitude: -13.2317,
    },
    {
      code: 'HUB-001',
      name: 'Freetown Regional Hub',
      type: 'hub',
      district: 'Western Area Urban',
      chiefdom: 'Freetown',
      address: 'Siaka Stevens Street',
      phone: '+232-76-000002',
      latitude: 8.4697,
      longitude: -13.2657,
    },
    {
      code: 'LAB-001',
      name: 'Central Public Health Laboratory',
      type: 'laboratory',
      district: 'Western Area Urban',
      chiefdom: 'Freetown',
      address: 'Connaught Hospital Compound',
      phone: '+232-76-000003',
      latitude: 8.4757,
      longitude: -13.2217,
    },
    {
      code: 'FAC-002',
      name: 'Bo Government Hospital',
      type: 'health_facility',
      district: 'Bo',
      chiefdom: 'Kakua',
      address: 'Bo-Kenema Highway',
      phone: '+232-76-000004',
      latitude: 7.9647,
      longitude: -11.7383,
    },
    {
      code: 'FAC-003',
      name: 'Kenema Government Hospital',
      type: 'health_facility',
      district: 'Kenema',
      chiefdom: 'Nongowa',
      address: 'Combema Road',
      phone: '+232-76-000005',
      latitude: 7.8767,
      longitude: -11.1903,
    },
    {
      code: 'FAC-004',
      name: 'Makeni Regional Hospital',
      type: 'health_facility',
      district: 'Bombali',
      chiefdom: 'Bombali Shebora',
      address: 'Makeni-Kabala Road',
      phone: '+232-76-000006',
      latitude: 8.8817,
      longitude: -12.0443,
    },
  ]);

  const password = await bcrypt.hash('password123', 12);
  const pin = await bcrypt.hash('1234', 10);

  await userRepo.save([
    {
      email: 'admin@nsrtms.gov.sl',
      phone: '+232-76-100001',
      firstName: 'System',
      lastName: 'Administrator',
      password,
      role: UserRole.ADMIN,
      facilityId: facilities[0].id,
      isActive: true,
      isVerified: true,
    },
    {
      email: 'collector@nsrtms.gov.sl',
      phone: '+232-76-100002',
      firstName: 'Aminata',
      lastName: 'Kamara',
      password,
      role: UserRole.COLLECTOR,
      facilityId: facilities[0].id,
      isActive: true,
      isVerified: true,
    },
    {
      email: 'rider@nsrtms.gov.sl',
      phone: '+232-76-100003',
      firstName: 'Mohamed',
      lastName: 'Sesay',
      password,
      pin,
      role: UserRole.DISPATCHER,
      facilityId: facilities[1].id,
      isActive: true,
      isVerified: true,
    },
    {
      email: 'hub@nsrtms.gov.sl',
      phone: '+232-76-100004',
      firstName: 'Fatmata',
      lastName: 'Bangura',
      password,
      role: UserRole.HUB_OFFICER,
      facilityId: facilities[1].id,
      isActive: true,
      isVerified: true,
    },
    {
      email: 'lab@nsrtms.gov.sl',
      phone: '+232-76-100005',
      firstName: 'Ibrahim',
      lastName: 'Koroma',
      password,
      role: UserRole.LAB_OFFICER,
      facilityId: facilities[2].id,
      isActive: true,
      isVerified: true,
    },
  ]);

  console.log('Seed data inserted successfully');
  console.log('---');
  console.log('Admin: admin@nsrtms.gov.sl / password123');
  console.log('Collector: collector@nsrtms.gov.sl / password123');
  console.log('Dispatcher: rider@nsrtms.gov.sl / password123 (PIN: 1234)');
  console.log('Hub Officer: hub@nsrtms.gov.sl / password123');
  console.log('Lab Officer: lab@nsrtms.gov.sl / password123');

  await ds.destroy();
}

seed().catch(console.error);
