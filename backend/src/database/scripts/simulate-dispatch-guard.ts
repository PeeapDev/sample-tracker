import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { DispatchService } from '../../modules/dispatch/dispatch.service';
import { SamplesService } from '../../modules/samples/samples.service';
import { User } from '../entities/user.entity';
import { Facility } from '../entities/facility.entity';
import { Sample } from '../entities/sample.entity';
import { Dispatch } from '../entities/dispatch.entity';
import { Notification } from '../entities/notification.entity';
import { EventLog } from '../entities/event-log.entity';
import { UserRole, SampleStatus, DispatchStatus } from '../enums';

// Proves the dispatch path can no longer skip the hub: marking a dispatch
// DELIVERED must NOT push a sample that never reached the hub straight to the
// lab. Then proves the in-sequence path still advances correctly.

const KEEP = process.env.KEEP === '1';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const dispatchSvc = app.get(DispatchService);
  const samplesSvc = app.get(SamplesService);
  const ds = app.get(DataSource);
  const userRepo = ds.getRepository(User);
  const facilityRepo = ds.getRepository(Facility);
  const sampleRepo = ds.getRepository(Sample);
  const dispatchRepo = ds.getRepository(Dispatch);

  const byRole = async (r: UserRole) => {
    const u = await userRepo.findOne({ where: { role: r, isActive: true } });
    if (!u) throw new Error(`No ${r}`);
    return u;
  };
  const collector = await byRole(UserRole.COLLECTOR);
  const rider = await byRole(UserRole.DISPATCHER);
  const hub = await byRole(UserRole.HUB_OFFICER);
  const origin = await facilityRepo.findOne({ where: { type: 'health_facility' } });
  const dest = await facilityRepo.findOne({ where: { type: 'laboratory' } });
  if (!origin || !dest) throw new Error('Need a facility + a lab');

  const check = (label: string, ok: boolean) =>
    console.log(`  ${ok ? '✓' : '✗ FAIL —'} ${label}`);

  // --- Scenario A: dispatch tries to deliver a not-yet-hubbed sample --------
  console.log('Scenario A — DELIVERED must not skip the hub:');
  const a = await samplesSvc.create(
    { sampleType: 'Blood', diseaseProgram: 'TB', quantity: 1, facilityId: origin.id, notes: 'DISPATCH GUARD TEST A' },
    collector.id,
  );
  const dispA = await dispatchSvc.create(
    { riderId: rider.id, originFacilityId: origin.id, destinationFacilityId: dest.id, sampleIds: [a.id] },
    rider.id,
  );
  // Sample is still COLLECTED. Force the dispatch to DELIVERED.
  await dispatchSvc.updateStatus(dispA.id, { status: DispatchStatus.DELIVERED }, rider.id);
  const aAfter = await sampleRepo.findOne({ where: { id: a.id } });
  check(
    `sample stayed at "${aAfter?.status}" (NOT lab_received) — hub cannot be skipped`,
    aAfter?.status === SampleStatus.COLLECTED,
  );

  // --- Scenario B: the proper in-sequence path still advances --------------
  console.log('\nScenario B — in-sequence path still works:');
  const b = await samplesSvc.create(
    { sampleType: 'Blood', diseaseProgram: 'TB', quantity: 1, facilityId: origin.id, notes: 'DISPATCH GUARD TEST B' },
    collector.id,
  );
  const dispB = await dispatchSvc.create(
    { riderId: rider.id, originFacilityId: origin.id, destinationFacilityId: dest.id, sampleIds: [b.id] },
    rider.id,
  );
  const actor = (u: User) => ({ sub: u.id, role: u.role, facilityId: u.facilityId });

  await dispatchSvc.updateStatus(dispB.id, { status: DispatchStatus.PICKED_UP }, rider.id);
  let s = await sampleRepo.findOne({ where: { id: b.id } });
  check(`dispatch PICKED_UP → sample "${s?.status}"`, s?.status === SampleStatus.PICKED_UP);

  // Hub officer scans it in (the step the dispatch cannot do for them).
  await samplesSvc.scanAdvance(b.sampleId, actor(hub), { sampleId: b.sampleId, action: 'advance' });
  s = await sampleRepo.findOne({ where: { id: b.id } });
  check(`hub scan → sample "${s?.status}"`, s?.status === SampleStatus.HUB_RECEIVED);

  await dispatchSvc.updateStatus(dispB.id, { status: DispatchStatus.IN_TRANSIT }, rider.id);
  s = await sampleRepo.findOne({ where: { id: b.id } });
  check(`dispatch IN_TRANSIT → sample "${s?.status}"`, s?.status === SampleStatus.IN_TRANSIT);

  await dispatchSvc.updateStatus(dispB.id, { status: DispatchStatus.DELIVERED }, rider.id);
  s = await sampleRepo.findOne({ where: { id: b.id } });
  check(`dispatch DELIVERED → sample "${s?.status}"`, s?.status === SampleStatus.LAB_RECEIVED);

  // --- Cleanup -------------------------------------------------------------
  if (!KEEP) {
    const ids = [a.id, b.id];
    await ds.getRepository(Notification).delete({ sampleId: ids[0] });
    await ds.getRepository(Notification).delete({ sampleId: ids[1] });
    await ds.getRepository(EventLog).delete({ sampleId: ids[0] });
    await ds.getRepository(EventLog).delete({ sampleId: ids[1] });
    await sampleRepo.delete({ id: ids[0] });
    await sampleRepo.delete({ id: ids[1] });
    await dispatchRepo.delete({ id: dispA.id });
    await dispatchRepo.delete({ id: dispB.id });
    console.log('\nCleaned up test samples + dispatches. (set KEEP=1 to retain)');
  }

  await app.close();
}

run().catch((e) => {
  console.error('DISPATCH GUARD TEST ERROR:', e);
  process.exit(1);
});
