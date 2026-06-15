import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Sample } from '../entities/sample.entity';
import { User } from '../entities/user.entity';
import { Facility } from '../entities/facility.entity';
import { Dispatch } from '../entities/dispatch.entity';
import { DispatchStatus, SampleStatus, UserRole } from '../enums';

// Idempotent top-up seed: adds a dedicated dispatcher account and a batch of
// realistic dispatch runs (with samples linked) so the Dispatches page and the
// dispatcher login both have real data to show. Safe to run more than once.
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

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rid = (n: number) =>
  Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

async function seed() {
  const ds = new DataSource(getDbConfig());
  await ds.initialize();
  console.log('Connected. Topping up dispatcher + dispatch data...');

  const userRepo = ds.getRepository(User);
  const facilityRepo = ds.getRepository(Facility);
  const dispatchRepo = ds.getRepository(Dispatch);
  const sampleRepo = ds.getRepository(Sample);

  const facilities = await facilityRepo.find();
  const hubs = facilities.filter((f) => f.type === 'hub');
  const labs = facilities.filter((f) => f.type === 'laboratory');
  const health = facilities.filter((f) => f.type === 'health_facility');
  const hub = hubs[0] ?? facilities[0];
  const lab = labs[0] ?? facilities[0];

  // 1) Add a dedicated dispatcher account if it doesn't exist yet.
  const dispatcherEmail = 'dispatcher@nsrtms.gov.sl';
  let dispatcher = await userRepo.findOne({ where: { email: dispatcherEmail } });
  if (!dispatcher) {
    dispatcher = await userRepo.save({
      email: dispatcherEmail,
      phone: '+232-76-100006',
      firstName: 'Mariama',
      lastName: 'Conteh',
      password: await bcrypt.hash('password123', 12),
      pin: await bcrypt.hash('1234', 10),
      role: UserRole.DISPATCHER,
      facilityId: hub.id,
      isActive: true,
      isVerified: true,
    });
    console.log(`Created dispatcher: ${dispatcherEmail} / password123`);
  } else {
    console.log('Dispatcher account already exists — skipping.');
  }

  // All dispatchers can ride a run.
  const riders = await userRepo.find({ where: { role: UserRole.DISPATCHER } });

  // 2) Seed dispatch runs (only if none exist, to stay idempotent).
  const existing = await dispatchRepo.count();
  if (existing > 0) {
    console.log(`${existing} dispatches already present — skipping dispatch seed.`);
    await ds.destroy();
    return;
  }

  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  // Weighted status pool: mostly delivered/in-transit, a couple pending.
  const STATUS_POOL: DispatchStatus[] = [
    ...Array(5).fill(DispatchStatus.DELIVERED),
    ...Array(3).fill(DispatchStatus.IN_TRANSIT),
    ...Array(2).fill(DispatchStatus.PICKED_UP),
    ...Array(2).fill(DispatchStatus.ASSIGNED),
    ...Array(1).fill(DispatchStatus.PENDING),
  ];

  // Samples that are mid-journey are good candidates to attach to a run.
  const movable = await sampleRepo.find({
    where: [
      { status: SampleStatus.PICKED_UP },
      { status: SampleStatus.IN_TRANSIT },
      { status: SampleStatus.HUB_RECEIVED },
      { status: SampleStatus.LAB_RECEIVED },
    ],
  });
  let cursor = 0;

  const COUNT = 12;
  for (let i = 0; i < COUNT; i++) {
    const status = STATUS_POOL[i % STATUS_POOL.length];
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.4) * 12);
    const createdAt = new Date(now - daysAgo * day - Math.floor(Math.random() * day));

    // Route: health facility -> hub, or hub -> lab.
    const legToLab = Math.random() < 0.5;
    const origin = legToLab ? hub : pick(health.length ? health : facilities);
    const destination = legToLab ? lab : hub;

    const sampleCount = 2 + Math.floor(Math.random() * 9);
    const pickupTime =
      status === DispatchStatus.PENDING || status === DispatchStatus.ASSIGNED
        ? null
        : new Date(createdAt.getTime() + Math.floor(Math.random() * 2 * hour));
    const deliveryTime = status === DispatchStatus.DELIVERED && pickupTime
      ? new Date(pickupTime.getTime() + (1 + Math.random() * 6) * hour)
      : null;
    const estimatedDeliveryTime = new Date(createdAt.getTime() + (3 + Math.random() * 8) * hour);

    const dispatch = dispatchRepo.create({
      dispatchId: `DSP-${rid(6)}`,
      status,
      riderId: pick(riders)?.id,
      originFacilityId: origin?.id,
      destinationFacilityId: destination?.id,
      sampleCount,
      coolerId: `CLR-${rid(4)}`,
      pickupTime: pickupTime ?? undefined,
      deliveryTime: deliveryTime ?? undefined,
      estimatedDeliveryTime,
      notes: legToLab ? 'Hub → Lab consolidated run' : 'Facility pickup run',
    });
    const saved = await dispatchRepo.save(dispatch);
    await ds.query('UPDATE dispatches SET "createdAt" = $1 WHERE id = $2', [createdAt, saved.id]);

    // Attach a few real samples to this run for the linked-sample view.
    const attach = movable.slice(cursor, cursor + Math.min(sampleCount, 4));
    cursor += attach.length;
    for (const s of attach) {
      await sampleRepo.update(s.id, { dispatchId: saved.id, dispatcherId: saved.riderId });
    }
  }

  console.log(`Inserted ${COUNT} dispatch runs (riders: ${riders.length}).`);
  await ds.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
