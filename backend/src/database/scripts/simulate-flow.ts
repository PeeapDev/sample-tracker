import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { SamplesService } from '../../modules/samples/samples.service';
import { User } from '../entities/user.entity';
import { Facility } from '../entities/facility.entity';
import { Sample } from '../entities/sample.entity';
import { Notification } from '../entities/notification.entity';
import { EventLog } from '../entities/event-log.entity';
import { UserRole, SampleStatus } from '../enums';

// End-to-end simulation of the sample lifecycle. Proves three things:
//   1. Each stage fires a notification and EVERY admin can see it.
//   2. Out-of-sequence / wrong-role scans are rejected (the hub cannot jump
//      ahead or complete a sample that has not reached its step).
//   3. The full happy path advances one step at a time, role by role.
// Set KEEP=1 to leave the simulated sample + notifications in the DB; by default
// it cleans everything it created so production data stays tidy.

const KEEP = process.env.KEEP === '1';

type Actor = { sub: string; role: UserRole; facilityId?: string; label: string };

function line() {
  console.log('────────────────────────────────────────────────────────');
}

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const samples = app.get(SamplesService);
  const ds = app.get(DataSource);
  const userRepo = ds.getRepository(User);
  const facilityRepo = ds.getRepository(Facility);
  const sampleRepo = ds.getRepository(Sample);
  const notifRepo = ds.getRepository(Notification);
  const eventRepo = ds.getRepository(EventLog);

  // --- Cast of actors (the seeded staff) ---------------------------------
  const byRole = async (role: UserRole) => {
    const u = await userRepo.findOne({ where: { role, isActive: true } });
    if (!u) throw new Error(`No active user with role ${role} — seed first.`);
    return u;
  };
  const collector = await byRole(UserRole.COLLECTOR);
  const rider = await byRole(UserRole.DISPATCHER);
  const hub = await byRole(UserRole.HUB_OFFICER);
  const lab = await byRole(UserRole.LAB_OFFICER);
  const admins = await userRepo.find({
    where: { role: UserRole.ADMIN, isActive: true },
    select: { id: true, email: true },
  });

  const riderActor: Actor = { sub: rider.id, role: rider.role, facilityId: rider.facilityId, label: 'Rider' };
  const hubActor: Actor = { sub: hub.id, role: hub.role, facilityId: hub.facilityId, label: 'Hub officer' };
  const labActor: Actor = { sub: lab.id, role: lab.role, facilityId: lab.facilityId, label: 'Lab officer' };

  console.log(`Admins on record: ${admins.length} (${admins.map((a) => a.email).join(', ')})`);
  line();

  // --- Create a fresh sample at a health facility (the origin) -----------
  const origin = await facilityRepo.findOne({ where: { type: 'health_facility' } });
  if (!origin) throw new Error('No health_facility to originate the sample from.');

  const sample = await samples.create(
    {
      sampleType: 'Blood',
      diseaseProgram: 'TB',
      quantity: 1,
      facilityId: origin.id,
      notes: 'FLOW SIMULATION — safe to delete',
    },
    collector.id,
  );
  console.log(`Created sample ${sample.sampleId} at ${origin.name} (status: ${sample.status})`);
  line();

  // Helper: show the notifications produced for this sample since `since`,
  // and confirm admin visibility (a broadcast row OR a per-admin row).
  let cursor = 0;
  const adminIds = new Set(admins.map((a) => a.id));
  const report = async (heading: string) => {
    const all = await notifRepo.find({
      where: { sampleId: sample.id },
      order: { createdAt: 'ASC' },
    });
    const fresh = all.slice(cursor);
    cursor = all.length;
    console.log(`\n${heading}`);
    if (fresh.length === 0) {
      console.log('  (no notifications)');
      return;
    }
    const broadcast = fresh.filter((n) => !n.userId);
    const personal = fresh.filter((n) => !!n.userId);
    const adminPersonal = personal.filter((n) => adminIds.has(n.userId!));
    console.log(`  "${fresh[0].title}" — ${fresh[0].message}`);
    console.log(`  rows created: ${fresh.length} (broadcast: ${broadcast.length}, personal: ${personal.length})`);
    // Admin visibility: bell query is (userId = me) OR (userId IS NULL).
    const adminsCovered = broadcast.length > 0 || adminPersonal.length >= admins.length;
    console.log(
      `  EVERY admin sees it? ${adminsCovered ? 'YES' : 'NO'} ` +
        `(${broadcast.length > 0 ? 'via broadcast row' : `${adminPersonal.length}/${admins.length} personal rows`})`,
    );
  };

  await report('① REGISTERED');

  // --- Sequence enforcement: wrong role / out of order should be blocked --
  console.log('\n② SEQUENCE GUARD — attempts that must be rejected:');
  const expectReject = async (actor: Actor, why: string) => {
    try {
      await samples.scanAdvance(sample.sampleId, actor, { sampleId: sample.sampleId, action: 'advance' });
      console.log(`  ✗ NOT BLOCKED — ${actor.label} ${why} (this is a bug!)`);
    } catch (e: any) {
      console.log(`  ✓ blocked: ${actor.label} ${why}`);
      console.log(`      → ${e.message}`);
    }
  };
  // Sample is COLLECTED. Only a DISPATCHER may scan it next.
  await expectReject(hubActor, 'tried to receive at hub before pickup');
  await expectReject(labActor, 'tried to receive at lab before pickup');

  // --- Happy path: one step at a time, correct role each time ------------
  console.log('\n③ HAPPY PATH — each scan advances exactly one stage:');
  const step = async (actor: Actor, heading: string) => {
    const res = await samples.scanAdvance(sample.sampleId, actor, {
      sampleId: sample.sampleId,
      action: 'advance',
      latitude: origin.latitude,
      longitude: origin.longitude,
    });
    console.log(`\n  ${actor.label}: ${res.previousStatus} → ${res.newStatus}`);
    await report(heading);
  };

  await step(riderActor, '   notif @ PICKED_UP');
  await step(hubActor, '   notif @ HUB_RECEIVED');
  await step(riderActor, '   notif @ IN_TRANSIT');
  await step(labActor, '   notif @ LAB_RECEIVED');
  await step(labActor, '   notif @ ANALYSIS_QUEUE');
  await step(labActor, '   notif @ COMPLETED (results ready)');

  // Sample is COMPLETED now — any further scan must be refused.
  console.log('\n④ TERMINAL GUARD — a completed sample cannot be scanned again:');
  await expectReject(hubActor, 'tried to scan a completed sample');

  line();
  const finalSample = await sampleRepo.findOne({ where: { id: sample.id } });
  console.log(`Final status: ${finalSample?.status}`);

  // --- Cleanup -----------------------------------------------------------
  if (!KEEP) {
    await notifRepo.delete({ sampleId: sample.id });
    await eventRepo.delete({ sampleId: sample.id });
    await sampleRepo.delete({ id: sample.id });
    console.log('Cleaned up simulated sample + its notifications/events. (set KEEP=1 to retain)');
  } else {
    console.log(`KEPT sample ${sample.sampleId} and its notifications in the DB.`);
  }

  await app.close();
}

run().catch((e) => {
  console.error('SIMULATION ERROR:', e);
  process.exit(1);
});
