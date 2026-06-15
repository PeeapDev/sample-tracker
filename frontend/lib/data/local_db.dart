import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'local_db.g.dart';

/// Local users cache. Stores enough to render the app *and* to authenticate
/// offline: when a user logs in successfully online, their bcrypt hash is
/// cached here so later logins work with no internet. [raw] keeps the full
/// server JSON (incl. nested facility) for lossless round-tripping.
class Users extends Table {
  TextColumn get id => text()();
  TextColumn get email => text()();
  TextColumn get phone => text().nullable()();
  TextColumn get firstName => text()();
  TextColumn get lastName => text()();
  TextColumn get role => text()();
  TextColumn get facilityId => text().nullable()();
  TextColumn get passwordHash => text().nullable()();
  TextColumn get pinHash => text().nullable()();
  BoolColumn get isActive => boolean().withDefault(const Constant(true))();
  TextColumn get raw => text().nullable()();
  DateTimeColumn get updatedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Reference data (collection sites, hubs, labs). Rarely changes; pulled on
/// sync and read offline.
class Facilities extends Table {
  TextColumn get id => text()();
  TextColumn get code => text().nullable()();
  TextColumn get name => text()();
  TextColumn get type => text().nullable()();
  TextColumn get district => text().nullable()();
  TextColumn get raw => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Samples — the core working set. Structured columns back the lists/filters
/// and dashboard aggregates; [raw] holds nested objects (collectedBy, facility,
/// dispatcher) as JSON. [dirty] marks rows created/edited offline that still
/// need to be pushed; [deleted] is a tombstone for offline deletes.
class Samples extends Table {
  TextColumn get id => text()();
  TextColumn get sampleId => text()();
  TextColumn get sampleType => text()();
  TextColumn get status => text()();
  TextColumn get diseaseProgram => text()();
  IntColumn get quantity => integer().withDefault(const Constant(0))();
  TextColumn get village => text().nullable()();
  IntColumn get patientAge => integer().nullable()();
  TextColumn get patientGender => text().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get qrCode => text().nullable()();
  TextColumn get facilityId => text().nullable()();
  TextColumn get collectedById => text().nullable()();
  TextColumn get dispatcherId => text().nullable()();
  TextColumn get dispatchId => text().nullable()();
  DateTimeColumn get collectedAt => dateTime().nullable()();
  DateTimeColumn get completedAt => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime().nullable()();
  TextColumn get raw => text().nullable()();
  BoolColumn get dirty => boolean().withDefault(const Constant(false))();
  BoolColumn get deleted => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Dispatch runs (rider movements between facilities).
class Dispatches extends Table {
  TextColumn get id => text()();
  TextColumn get dispatchId => text()();
  TextColumn get status => text()();
  IntColumn get sampleCount => integer().withDefault(const Constant(0))();
  TextColumn get coolerId => text().nullable()();
  TextColumn get riderId => text().nullable()();
  TextColumn get originFacilityId => text().nullable()();
  TextColumn get destinationFacilityId => text().nullable()();
  DateTimeColumn get createdAt => dateTime().nullable()();
  TextColumn get raw => text().nullable()();
  BoolColumn get dirty => boolean().withDefault(const Constant(false))();
  BoolColumn get deleted => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Sample/dispatch timeline events.
class EventLogs extends Table {
  TextColumn get id => text()();
  TextColumn get event => text()();
  TextColumn get description => text().nullable()();
  TextColumn get sampleId => text().nullable()();
  TextColumn get dispatchId => text().nullable()();
  DateTimeColumn get timestamp => dateTime().nullable()();
  TextColumn get raw => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Durable write queue. Replaces the SharedPreferences-backed outbox so pending
/// mutations survive in the same transactional store as the data and can be
/// ordered/retried reliably. One row per offline mutation.
class Outbox extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get method => text()(); // POST | PATCH | DELETE
  TextColumn get path => text()();
  TextColumn get body => text().nullable()(); // JSON
  TextColumn get entityType => text().nullable()();
  TextColumn get entityId => text().nullable()();
  IntColumn get attempts => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
}

@DriftDatabase(
  tables: [Users, Facilities, Samples, Dispatches, EventLogs, Outbox],
)
class LocalDb extends _$LocalDb {
  LocalDb() : super(_open());

  /// Test/in-memory constructor.
  LocalDb.forTesting(super.executor);

  @override
  int get schemaVersion => 1;

  static QueryExecutor _open() {
    return LazyDatabase(() async {
      final dir = await getApplicationSupportDirectory();
      final file = File(p.join(dir.path, 'nsrtms.sqlite'));
      return NativeDatabase.createInBackground(file);
    });
  }
}
