import 'dart:convert';
import 'package:drift/drift.dart';
import '../models/models.dart';
import 'local_db.dart';

/// Single entry point for all local reads/writes.
///
/// Providers talk to this instead of HTTP. The sync engine fills it from the
/// server when online (`upsert*`) and drains the [Outbox] of offline writes.
/// Every record keeps the full server JSON in its `raw` column so reads can
/// rebuild the exact model the UI expects, nested objects and all.
class LocalRepository {
  LocalRepository(this.db);
  final LocalDb db;

  // ---------------------------------------------------------------- helpers
  static DateTime? _parseDate(dynamic v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    return DateTime.tryParse(v.toString());
  }

  static String? _str(dynamic v) => v?.toString();

  // ------------------------------------------------------------------- users
  /// Replace/insert users pulled from the server. Preserves any cached
  /// credential hashes (the server never sends those back).
  Future<void> upsertUsers(List<Map<String, dynamic>> users) async {
    await db.batch((b) {
      for (final u in users) {
        b.insert(
          db.users,
          UsersCompanion(
            id: Value(u['id'].toString()),
            email: Value(_str(u['email']) ?? ''),
            phone: Value(_str(u['phone'])),
            firstName: Value(_str(u['firstName']) ?? ''),
            lastName: Value(_str(u['lastName']) ?? ''),
            role: Value(_str(u['role']) ?? ''),
            facilityId: Value(_str(u['facilityId'])),
            isActive: Value(u['isActive'] != false),
            raw: Value(jsonEncode(u)),
            updatedAt: Value(_parseDate(u['updatedAt'])),
          ),
          // Don't clobber passwordHash/pinHash on update.
          onConflict: DoUpdate(
            (old) => UsersCompanion(
              email: Value(_str(u['email']) ?? ''),
              phone: Value(_str(u['phone'])),
              firstName: Value(_str(u['firstName']) ?? ''),
              lastName: Value(_str(u['lastName']) ?? ''),
              role: Value(_str(u['role']) ?? ''),
              facilityId: Value(_str(u['facilityId'])),
              isActive: Value(u['isActive'] != false),
              raw: Value(jsonEncode(u)),
              updatedAt: Value(_parseDate(u['updatedAt'])),
            ),
          ),
        );
      }
    });
  }

  Future<UserModel?> findUserByEmail(String email) async {
    final row = await (db.select(db.users)
          ..where((t) => t.email.equals(email))
          ..limit(1))
        .getSingleOrNull();
    return row == null ? null : _userToModel(row);
  }

  /// Returns the cached bcrypt password hash for offline login, if present.
  Future<String?> cachedPasswordHash(String email) async {
    final row = await (db.select(db.users)
          ..where((t) => t.email.equals(email))
          ..limit(1))
        .getSingleOrNull();
    return row?.passwordHash;
  }

  Future<void> cacheCredential(String userId,
      {String? passwordHash, String? pinHash}) async {
    await (db.update(db.users)..where((t) => t.id.equals(userId))).write(
      UsersCompanion(
        passwordHash:
            passwordHash == null ? const Value.absent() : Value(passwordHash),
        pinHash: pinHash == null ? const Value.absent() : Value(pinHash),
      ),
    );
  }

  Future<List<UserModel>> getUsers() async {
    final rows = await db.select(db.users).get();
    return rows.map(_userToModel).toList();
  }

  UserModel _userToModel(User row) {
    if (row.raw != null) {
      return UserModel.fromJson(jsonDecode(row.raw!) as Map<String, dynamic>);
    }
    return UserModel(
      id: row.id,
      email: row.email,
      phone: row.phone,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      facilityId: row.facilityId,
    );
  }

  // ----------------------------------------------------------------- samples
  Future<void> upsertSamples(List<Map<String, dynamic>> samples) async {
    await db.batch((b) {
      for (final s in samples) {
        b.insert(db.samples, _sampleCompanion(s),
            onConflict: DoUpdate((_) => _sampleCompanion(s)));
      }
    });
  }

  SamplesCompanion _sampleCompanion(Map<String, dynamic> s, {bool dirty = false}) {
    return SamplesCompanion(
      id: Value(s['id'].toString()),
      sampleId: Value(_str(s['sampleId']) ?? ''),
      sampleType: Value(_str(s['sampleType']) ?? ''),
      status: Value(_str(s['status']) ?? ''),
      diseaseProgram: Value(_str(s['diseaseProgram']) ?? ''),
      quantity: Value((s['quantity'] as num?)?.toInt() ?? 0),
      village: Value(_str(s['village'])),
      patientAge: Value((s['patientAge'] as num?)?.toInt()),
      patientGender: Value(_str(s['patientGender'])),
      notes: Value(_str(s['notes'])),
      qrCode: Value(_str(s['qrCode'])),
      facilityId: Value(_str(s['facilityId'])),
      collectedById: Value(_str(s['collectedById'])),
      dispatcherId: Value(_str(s['dispatcherId'])),
      dispatchId: Value(_str(s['dispatchId'])),
      collectedAt: Value(_parseDate(s['collectedAt'])),
      completedAt: Value(_parseDate(s['completedAt'])),
      createdAt: Value(_parseDate(s['createdAt'])),
      raw: Value(jsonEncode(s)),
      dirty: Value(dirty),
    );
  }

  Future<List<SampleModel>> getSamples({String? status, String? facilityId}) async {
    final q = db.select(db.samples)..where((t) => t.deleted.equals(false));
    if (status != null) q.where((t) => t.status.equals(status));
    if (facilityId != null) q.where((t) => t.facilityId.equals(facilityId));
    q.orderBy([(t) => OrderingTerm.desc(t.createdAt)]);
    final rows = await q.get();
    return rows.map(_sampleToModel).toList();
  }

  SampleModel _sampleToModel(Sample row) {
    if (row.raw != null) {
      return SampleModel.fromJson(jsonDecode(row.raw!) as Map<String, dynamic>);
    }
    return SampleModel(
      id: row.id,
      sampleId: row.sampleId,
      sampleType: row.sampleType,
      status: row.status,
      diseaseProgram: row.diseaseProgram,
      quantity: row.quantity,
      village: row.village,
      patientAge: row.patientAge,
      patientGender: row.patientGender,
      notes: row.notes,
      qrCode: row.qrCode,
      dispatchId: row.dispatchId,
      collectedAt: row.collectedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0),
    );
  }

  /// Persist a sample created/edited offline and queue it for the server.
  Future<void> saveLocalSample(Map<String, dynamic> sample,
      {required String method, required String path}) async {
    await db.transaction(() async {
      await db.into(db.samples).insertOnConflictUpdate(
            _sampleCompanion(sample, dirty: true),
          );
      await enqueue(method, path, body: sample,
          entityType: 'sample', entityId: _str(sample['id']));
    });
  }

  // -------------------------------------------------------------- dispatches
  Future<void> upsertDispatches(List<Map<String, dynamic>> items) async {
    await db.batch((b) {
      for (final d in items) {
        final c = DispatchesCompanion(
          id: Value(d['id'].toString()),
          dispatchId: Value(_str(d['dispatchId']) ?? ''),
          status: Value(_str(d['status']) ?? ''),
          sampleCount: Value((d['sampleCount'] as num?)?.toInt() ?? 0),
          coolerId: Value(_str(d['coolerId'])),
          createdAt: Value(_parseDate(d['createdAt'])),
          raw: Value(jsonEncode(d)),
        );
        b.insert(db.dispatches, c, onConflict: DoUpdate((_) => c));
      }
    });
  }

  Future<List<DispatchModel>> getDispatches() async {
    final rows = await (db.select(db.dispatches)
          ..where((t) => t.deleted.equals(false))
          ..orderBy([(t) => OrderingTerm.desc(t.createdAt)]))
        .get();
    return rows
        .map((r) => r.raw != null
            ? DispatchModel.fromJson(jsonDecode(r.raw!) as Map<String, dynamic>)
            : DispatchModel(
                id: r.id,
                dispatchId: r.dispatchId,
                status: r.status,
                sampleCount: r.sampleCount,
                coolerId: r.coolerId,
                createdAt: r.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0),
              ))
        .toList();
  }

  // ------------------------------------------------------------ event logs
  Future<void> upsertEvents(List<Map<String, dynamic>> items,
      {String? sampleId}) async {
    await db.batch((b) {
      for (final e in items) {
        final c = EventLogsCompanion(
          id: Value(e['id'].toString()),
          event: Value(_str(e['event']) ?? ''),
          description: Value(_str(e['description'])),
          sampleId: Value(_str(e['sampleId']) ?? sampleId),
          dispatchId: Value(_str(e['dispatchId'])),
          timestamp: Value(_parseDate(e['timestamp'])),
          raw: Value(jsonEncode(e)),
        );
        b.insert(db.eventLogs, c, onConflict: DoUpdate((_) => c));
      }
    });
  }

  Future<List<EventLogModel>> getTimeline(String sampleId) async {
    final rows = await (db.select(db.eventLogs)
          ..where((t) => t.sampleId.equals(sampleId))
          ..orderBy([(t) => OrderingTerm.desc(t.timestamp)]))
        .get();
    return rows
        .map((r) => r.raw != null
            ? EventLogModel.fromJson(jsonDecode(r.raw!) as Map<String, dynamic>)
            : EventLogModel(
                id: r.id,
                event: r.event,
                description: r.description,
                timestamp: r.timestamp ?? DateTime.fromMillisecondsSinceEpoch(0),
              ))
        .toList();
  }

  // ------------------------------------------------------------- facilities
  Future<void> upsertFacilities(List<Map<String, dynamic>> items) async {
    await db.batch((b) {
      for (final f in items) {
        final c = FacilitiesCompanion(
          id: Value(f['id'].toString()),
          code: Value(_str(f['code'])),
          name: Value(_str(f['name']) ?? ''),
          type: Value(_str(f['type'])),
          district: Value(_str(f['district'])),
          raw: Value(jsonEncode(f)),
        );
        b.insert(db.facilities, c, onConflict: DoUpdate((_) => c));
      }
    });
  }

  // ----------------------------------------------------------------- outbox
  Future<void> enqueue(String method, String path,
      {Map<String, dynamic>? body, String? entityType, String? entityId}) async {
    await db.into(db.outbox).insert(
          OutboxCompanion.insert(
            method: method,
            path: path,
            body: Value(body == null ? null : jsonEncode(body)),
            entityType: Value(entityType),
            entityId: Value(entityId),
            createdAt: DateTime.now(),
          ),
        );
  }

  Future<List<OutboxData>> pendingOutbox() {
    return (db.select(db.outbox)
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();
  }

  Future<int> outboxCount() async {
    final count = db.outbox.id.count();
    final row = await (db.selectOnly(db.outbox)..addColumns([count]))
        .getSingle();
    return row.read(count) ?? 0;
  }

  Future<void> deleteOutbox(int id) async {
    await (db.delete(db.outbox)..where((t) => t.id.equals(id))).go();
  }

  Future<void> recordOutboxFailure(int id, String error) async {
    await (db.update(db.outbox)..where((t) => t.id.equals(id))).write(
      OutboxCompanion(
        lastError: Value(error),
        attempts: const Value.absent(),
      ),
    );
  }
}
