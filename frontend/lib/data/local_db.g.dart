// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'local_db.dart';

// ignore_for_file: type=lint
class $UsersTable extends Users with TableInfo<$UsersTable, User> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UsersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _emailMeta = const VerificationMeta('email');
  @override
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
      'email', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
      'phone', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _firstNameMeta =
      const VerificationMeta('firstName');
  @override
  late final GeneratedColumn<String> firstName = GeneratedColumn<String>(
      'first_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _lastNameMeta =
      const VerificationMeta('lastName');
  @override
  late final GeneratedColumn<String> lastName = GeneratedColumn<String>(
      'last_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _roleMeta = const VerificationMeta('role');
  @override
  late final GeneratedColumn<String> role = GeneratedColumn<String>(
      'role', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _facilityIdMeta =
      const VerificationMeta('facilityId');
  @override
  late final GeneratedColumn<String> facilityId = GeneratedColumn<String>(
      'facility_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _passwordHashMeta =
      const VerificationMeta('passwordHash');
  @override
  late final GeneratedColumn<String> passwordHash = GeneratedColumn<String>(
      'password_hash', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _pinHashMeta =
      const VerificationMeta('pinHash');
  @override
  late final GeneratedColumn<String> pinHash = GeneratedColumn<String>(
      'pin_hash', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _isActiveMeta =
      const VerificationMeta('isActive');
  @override
  late final GeneratedColumn<bool> isActive = GeneratedColumn<bool>(
      'is_active', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_active" IN (0, 1))'),
      defaultValue: const Constant(true));
  static const VerificationMeta _rawMeta = const VerificationMeta('raw');
  @override
  late final GeneratedColumn<String> raw = GeneratedColumn<String>(
      'raw', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        email,
        phone,
        firstName,
        lastName,
        role,
        facilityId,
        passwordHash,
        pinHash,
        isActive,
        raw,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'users';
  @override
  VerificationContext validateIntegrity(Insertable<User> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('email')) {
      context.handle(
          _emailMeta, email.isAcceptableOrUnknown(data['email']!, _emailMeta));
    } else if (isInserting) {
      context.missing(_emailMeta);
    }
    if (data.containsKey('phone')) {
      context.handle(
          _phoneMeta, phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta));
    }
    if (data.containsKey('first_name')) {
      context.handle(_firstNameMeta,
          firstName.isAcceptableOrUnknown(data['first_name']!, _firstNameMeta));
    } else if (isInserting) {
      context.missing(_firstNameMeta);
    }
    if (data.containsKey('last_name')) {
      context.handle(_lastNameMeta,
          lastName.isAcceptableOrUnknown(data['last_name']!, _lastNameMeta));
    } else if (isInserting) {
      context.missing(_lastNameMeta);
    }
    if (data.containsKey('role')) {
      context.handle(
          _roleMeta, role.isAcceptableOrUnknown(data['role']!, _roleMeta));
    } else if (isInserting) {
      context.missing(_roleMeta);
    }
    if (data.containsKey('facility_id')) {
      context.handle(
          _facilityIdMeta,
          facilityId.isAcceptableOrUnknown(
              data['facility_id']!, _facilityIdMeta));
    }
    if (data.containsKey('password_hash')) {
      context.handle(
          _passwordHashMeta,
          passwordHash.isAcceptableOrUnknown(
              data['password_hash']!, _passwordHashMeta));
    }
    if (data.containsKey('pin_hash')) {
      context.handle(_pinHashMeta,
          pinHash.isAcceptableOrUnknown(data['pin_hash']!, _pinHashMeta));
    }
    if (data.containsKey('is_active')) {
      context.handle(_isActiveMeta,
          isActive.isAcceptableOrUnknown(data['is_active']!, _isActiveMeta));
    }
    if (data.containsKey('raw')) {
      context.handle(
          _rawMeta, raw.isAcceptableOrUnknown(data['raw']!, _rawMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  User map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return User(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      email: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}email'])!,
      phone: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}phone']),
      firstName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}first_name'])!,
      lastName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}last_name'])!,
      role: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}role'])!,
      facilityId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}facility_id']),
      passwordHash: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}password_hash']),
      pinHash: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}pin_hash']),
      isActive: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_active'])!,
      raw: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}raw']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $UsersTable createAlias(String alias) {
    return $UsersTable(attachedDatabase, alias);
  }
}

class User extends DataClass implements Insertable<User> {
  final String id;
  final String email;
  final String? phone;
  final String firstName;
  final String lastName;
  final String role;
  final String? facilityId;
  final String? passwordHash;
  final String? pinHash;
  final bool isActive;
  final String? raw;
  final DateTime? updatedAt;
  const User(
      {required this.id,
      required this.email,
      this.phone,
      required this.firstName,
      required this.lastName,
      required this.role,
      this.facilityId,
      this.passwordHash,
      this.pinHash,
      required this.isActive,
      this.raw,
      this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['email'] = Variable<String>(email);
    if (!nullToAbsent || phone != null) {
      map['phone'] = Variable<String>(phone);
    }
    map['first_name'] = Variable<String>(firstName);
    map['last_name'] = Variable<String>(lastName);
    map['role'] = Variable<String>(role);
    if (!nullToAbsent || facilityId != null) {
      map['facility_id'] = Variable<String>(facilityId);
    }
    if (!nullToAbsent || passwordHash != null) {
      map['password_hash'] = Variable<String>(passwordHash);
    }
    if (!nullToAbsent || pinHash != null) {
      map['pin_hash'] = Variable<String>(pinHash);
    }
    map['is_active'] = Variable<bool>(isActive);
    if (!nullToAbsent || raw != null) {
      map['raw'] = Variable<String>(raw);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<DateTime>(updatedAt);
    }
    return map;
  }

  UsersCompanion toCompanion(bool nullToAbsent) {
    return UsersCompanion(
      id: Value(id),
      email: Value(email),
      phone:
          phone == null && nullToAbsent ? const Value.absent() : Value(phone),
      firstName: Value(firstName),
      lastName: Value(lastName),
      role: Value(role),
      facilityId: facilityId == null && nullToAbsent
          ? const Value.absent()
          : Value(facilityId),
      passwordHash: passwordHash == null && nullToAbsent
          ? const Value.absent()
          : Value(passwordHash),
      pinHash: pinHash == null && nullToAbsent
          ? const Value.absent()
          : Value(pinHash),
      isActive: Value(isActive),
      raw: raw == null && nullToAbsent ? const Value.absent() : Value(raw),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory User.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return User(
      id: serializer.fromJson<String>(json['id']),
      email: serializer.fromJson<String>(json['email']),
      phone: serializer.fromJson<String?>(json['phone']),
      firstName: serializer.fromJson<String>(json['firstName']),
      lastName: serializer.fromJson<String>(json['lastName']),
      role: serializer.fromJson<String>(json['role']),
      facilityId: serializer.fromJson<String?>(json['facilityId']),
      passwordHash: serializer.fromJson<String?>(json['passwordHash']),
      pinHash: serializer.fromJson<String?>(json['pinHash']),
      isActive: serializer.fromJson<bool>(json['isActive']),
      raw: serializer.fromJson<String?>(json['raw']),
      updatedAt: serializer.fromJson<DateTime?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'email': serializer.toJson<String>(email),
      'phone': serializer.toJson<String?>(phone),
      'firstName': serializer.toJson<String>(firstName),
      'lastName': serializer.toJson<String>(lastName),
      'role': serializer.toJson<String>(role),
      'facilityId': serializer.toJson<String?>(facilityId),
      'passwordHash': serializer.toJson<String?>(passwordHash),
      'pinHash': serializer.toJson<String?>(pinHash),
      'isActive': serializer.toJson<bool>(isActive),
      'raw': serializer.toJson<String?>(raw),
      'updatedAt': serializer.toJson<DateTime?>(updatedAt),
    };
  }

  User copyWith(
          {String? id,
          String? email,
          Value<String?> phone = const Value.absent(),
          String? firstName,
          String? lastName,
          String? role,
          Value<String?> facilityId = const Value.absent(),
          Value<String?> passwordHash = const Value.absent(),
          Value<String?> pinHash = const Value.absent(),
          bool? isActive,
          Value<String?> raw = const Value.absent(),
          Value<DateTime?> updatedAt = const Value.absent()}) =>
      User(
        id: id ?? this.id,
        email: email ?? this.email,
        phone: phone.present ? phone.value : this.phone,
        firstName: firstName ?? this.firstName,
        lastName: lastName ?? this.lastName,
        role: role ?? this.role,
        facilityId: facilityId.present ? facilityId.value : this.facilityId,
        passwordHash:
            passwordHash.present ? passwordHash.value : this.passwordHash,
        pinHash: pinHash.present ? pinHash.value : this.pinHash,
        isActive: isActive ?? this.isActive,
        raw: raw.present ? raw.value : this.raw,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  User copyWithCompanion(UsersCompanion data) {
    return User(
      id: data.id.present ? data.id.value : this.id,
      email: data.email.present ? data.email.value : this.email,
      phone: data.phone.present ? data.phone.value : this.phone,
      firstName: data.firstName.present ? data.firstName.value : this.firstName,
      lastName: data.lastName.present ? data.lastName.value : this.lastName,
      role: data.role.present ? data.role.value : this.role,
      facilityId:
          data.facilityId.present ? data.facilityId.value : this.facilityId,
      passwordHash: data.passwordHash.present
          ? data.passwordHash.value
          : this.passwordHash,
      pinHash: data.pinHash.present ? data.pinHash.value : this.pinHash,
      isActive: data.isActive.present ? data.isActive.value : this.isActive,
      raw: data.raw.present ? data.raw.value : this.raw,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('User(')
          ..write('id: $id, ')
          ..write('email: $email, ')
          ..write('phone: $phone, ')
          ..write('firstName: $firstName, ')
          ..write('lastName: $lastName, ')
          ..write('role: $role, ')
          ..write('facilityId: $facilityId, ')
          ..write('passwordHash: $passwordHash, ')
          ..write('pinHash: $pinHash, ')
          ..write('isActive: $isActive, ')
          ..write('raw: $raw, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, email, phone, firstName, lastName, role,
      facilityId, passwordHash, pinHash, isActive, raw, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is User &&
          other.id == this.id &&
          other.email == this.email &&
          other.phone == this.phone &&
          other.firstName == this.firstName &&
          other.lastName == this.lastName &&
          other.role == this.role &&
          other.facilityId == this.facilityId &&
          other.passwordHash == this.passwordHash &&
          other.pinHash == this.pinHash &&
          other.isActive == this.isActive &&
          other.raw == this.raw &&
          other.updatedAt == this.updatedAt);
}

class UsersCompanion extends UpdateCompanion<User> {
  final Value<String> id;
  final Value<String> email;
  final Value<String?> phone;
  final Value<String> firstName;
  final Value<String> lastName;
  final Value<String> role;
  final Value<String?> facilityId;
  final Value<String?> passwordHash;
  final Value<String?> pinHash;
  final Value<bool> isActive;
  final Value<String?> raw;
  final Value<DateTime?> updatedAt;
  final Value<int> rowid;
  const UsersCompanion({
    this.id = const Value.absent(),
    this.email = const Value.absent(),
    this.phone = const Value.absent(),
    this.firstName = const Value.absent(),
    this.lastName = const Value.absent(),
    this.role = const Value.absent(),
    this.facilityId = const Value.absent(),
    this.passwordHash = const Value.absent(),
    this.pinHash = const Value.absent(),
    this.isActive = const Value.absent(),
    this.raw = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  UsersCompanion.insert({
    required String id,
    required String email,
    this.phone = const Value.absent(),
    required String firstName,
    required String lastName,
    required String role,
    this.facilityId = const Value.absent(),
    this.passwordHash = const Value.absent(),
    this.pinHash = const Value.absent(),
    this.isActive = const Value.absent(),
    this.raw = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        email = Value(email),
        firstName = Value(firstName),
        lastName = Value(lastName),
        role = Value(role);
  static Insertable<User> custom({
    Expression<String>? id,
    Expression<String>? email,
    Expression<String>? phone,
    Expression<String>? firstName,
    Expression<String>? lastName,
    Expression<String>? role,
    Expression<String>? facilityId,
    Expression<String>? passwordHash,
    Expression<String>? pinHash,
    Expression<bool>? isActive,
    Expression<String>? raw,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (firstName != null) 'first_name': firstName,
      if (lastName != null) 'last_name': lastName,
      if (role != null) 'role': role,
      if (facilityId != null) 'facility_id': facilityId,
      if (passwordHash != null) 'password_hash': passwordHash,
      if (pinHash != null) 'pin_hash': pinHash,
      if (isActive != null) 'is_active': isActive,
      if (raw != null) 'raw': raw,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  UsersCompanion copyWith(
      {Value<String>? id,
      Value<String>? email,
      Value<String?>? phone,
      Value<String>? firstName,
      Value<String>? lastName,
      Value<String>? role,
      Value<String?>? facilityId,
      Value<String?>? passwordHash,
      Value<String?>? pinHash,
      Value<bool>? isActive,
      Value<String?>? raw,
      Value<DateTime?>? updatedAt,
      Value<int>? rowid}) {
    return UsersCompanion(
      id: id ?? this.id,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      facilityId: facilityId ?? this.facilityId,
      passwordHash: passwordHash ?? this.passwordHash,
      pinHash: pinHash ?? this.pinHash,
      isActive: isActive ?? this.isActive,
      raw: raw ?? this.raw,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (firstName.present) {
      map['first_name'] = Variable<String>(firstName.value);
    }
    if (lastName.present) {
      map['last_name'] = Variable<String>(lastName.value);
    }
    if (role.present) {
      map['role'] = Variable<String>(role.value);
    }
    if (facilityId.present) {
      map['facility_id'] = Variable<String>(facilityId.value);
    }
    if (passwordHash.present) {
      map['password_hash'] = Variable<String>(passwordHash.value);
    }
    if (pinHash.present) {
      map['pin_hash'] = Variable<String>(pinHash.value);
    }
    if (isActive.present) {
      map['is_active'] = Variable<bool>(isActive.value);
    }
    if (raw.present) {
      map['raw'] = Variable<String>(raw.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UsersCompanion(')
          ..write('id: $id, ')
          ..write('email: $email, ')
          ..write('phone: $phone, ')
          ..write('firstName: $firstName, ')
          ..write('lastName: $lastName, ')
          ..write('role: $role, ')
          ..write('facilityId: $facilityId, ')
          ..write('passwordHash: $passwordHash, ')
          ..write('pinHash: $pinHash, ')
          ..write('isActive: $isActive, ')
          ..write('raw: $raw, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FacilitiesTable extends Facilities
    with TableInfo<$FacilitiesTable, Facility> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FacilitiesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _codeMeta = const VerificationMeta('code');
  @override
  late final GeneratedColumn<String> code = GeneratedColumn<String>(
      'code', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
      'type', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _districtMeta =
      const VerificationMeta('district');
  @override
  late final GeneratedColumn<String> district = GeneratedColumn<String>(
      'district', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _rawMeta = const VerificationMeta('raw');
  @override
  late final GeneratedColumn<String> raw = GeneratedColumn<String>(
      'raw', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [id, code, name, type, district, raw];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'facilities';
  @override
  VerificationContext validateIntegrity(Insertable<Facility> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('code')) {
      context.handle(
          _codeMeta, code.isAcceptableOrUnknown(data['code']!, _codeMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
          _typeMeta, type.isAcceptableOrUnknown(data['type']!, _typeMeta));
    }
    if (data.containsKey('district')) {
      context.handle(_districtMeta,
          district.isAcceptableOrUnknown(data['district']!, _districtMeta));
    }
    if (data.containsKey('raw')) {
      context.handle(
          _rawMeta, raw.isAcceptableOrUnknown(data['raw']!, _rawMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Facility map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Facility(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      code: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}code']),
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      type: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}type']),
      district: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}district']),
      raw: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}raw']),
    );
  }

  @override
  $FacilitiesTable createAlias(String alias) {
    return $FacilitiesTable(attachedDatabase, alias);
  }
}

class Facility extends DataClass implements Insertable<Facility> {
  final String id;
  final String? code;
  final String name;
  final String? type;
  final String? district;
  final String? raw;
  const Facility(
      {required this.id,
      this.code,
      required this.name,
      this.type,
      this.district,
      this.raw});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    if (!nullToAbsent || code != null) {
      map['code'] = Variable<String>(code);
    }
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || type != null) {
      map['type'] = Variable<String>(type);
    }
    if (!nullToAbsent || district != null) {
      map['district'] = Variable<String>(district);
    }
    if (!nullToAbsent || raw != null) {
      map['raw'] = Variable<String>(raw);
    }
    return map;
  }

  FacilitiesCompanion toCompanion(bool nullToAbsent) {
    return FacilitiesCompanion(
      id: Value(id),
      code: code == null && nullToAbsent ? const Value.absent() : Value(code),
      name: Value(name),
      type: type == null && nullToAbsent ? const Value.absent() : Value(type),
      district: district == null && nullToAbsent
          ? const Value.absent()
          : Value(district),
      raw: raw == null && nullToAbsent ? const Value.absent() : Value(raw),
    );
  }

  factory Facility.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Facility(
      id: serializer.fromJson<String>(json['id']),
      code: serializer.fromJson<String?>(json['code']),
      name: serializer.fromJson<String>(json['name']),
      type: serializer.fromJson<String?>(json['type']),
      district: serializer.fromJson<String?>(json['district']),
      raw: serializer.fromJson<String?>(json['raw']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'code': serializer.toJson<String?>(code),
      'name': serializer.toJson<String>(name),
      'type': serializer.toJson<String?>(type),
      'district': serializer.toJson<String?>(district),
      'raw': serializer.toJson<String?>(raw),
    };
  }

  Facility copyWith(
          {String? id,
          Value<String?> code = const Value.absent(),
          String? name,
          Value<String?> type = const Value.absent(),
          Value<String?> district = const Value.absent(),
          Value<String?> raw = const Value.absent()}) =>
      Facility(
        id: id ?? this.id,
        code: code.present ? code.value : this.code,
        name: name ?? this.name,
        type: type.present ? type.value : this.type,
        district: district.present ? district.value : this.district,
        raw: raw.present ? raw.value : this.raw,
      );
  Facility copyWithCompanion(FacilitiesCompanion data) {
    return Facility(
      id: data.id.present ? data.id.value : this.id,
      code: data.code.present ? data.code.value : this.code,
      name: data.name.present ? data.name.value : this.name,
      type: data.type.present ? data.type.value : this.type,
      district: data.district.present ? data.district.value : this.district,
      raw: data.raw.present ? data.raw.value : this.raw,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Facility(')
          ..write('id: $id, ')
          ..write('code: $code, ')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('district: $district, ')
          ..write('raw: $raw')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, code, name, type, district, raw);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Facility &&
          other.id == this.id &&
          other.code == this.code &&
          other.name == this.name &&
          other.type == this.type &&
          other.district == this.district &&
          other.raw == this.raw);
}

class FacilitiesCompanion extends UpdateCompanion<Facility> {
  final Value<String> id;
  final Value<String?> code;
  final Value<String> name;
  final Value<String?> type;
  final Value<String?> district;
  final Value<String?> raw;
  final Value<int> rowid;
  const FacilitiesCompanion({
    this.id = const Value.absent(),
    this.code = const Value.absent(),
    this.name = const Value.absent(),
    this.type = const Value.absent(),
    this.district = const Value.absent(),
    this.raw = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FacilitiesCompanion.insert({
    required String id,
    this.code = const Value.absent(),
    required String name,
    this.type = const Value.absent(),
    this.district = const Value.absent(),
    this.raw = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        name = Value(name);
  static Insertable<Facility> custom({
    Expression<String>? id,
    Expression<String>? code,
    Expression<String>? name,
    Expression<String>? type,
    Expression<String>? district,
    Expression<String>? raw,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (code != null) 'code': code,
      if (name != null) 'name': name,
      if (type != null) 'type': type,
      if (district != null) 'district': district,
      if (raw != null) 'raw': raw,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FacilitiesCompanion copyWith(
      {Value<String>? id,
      Value<String?>? code,
      Value<String>? name,
      Value<String?>? type,
      Value<String?>? district,
      Value<String?>? raw,
      Value<int>? rowid}) {
    return FacilitiesCompanion(
      id: id ?? this.id,
      code: code ?? this.code,
      name: name ?? this.name,
      type: type ?? this.type,
      district: district ?? this.district,
      raw: raw ?? this.raw,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (code.present) {
      map['code'] = Variable<String>(code.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (district.present) {
      map['district'] = Variable<String>(district.value);
    }
    if (raw.present) {
      map['raw'] = Variable<String>(raw.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FacilitiesCompanion(')
          ..write('id: $id, ')
          ..write('code: $code, ')
          ..write('name: $name, ')
          ..write('type: $type, ')
          ..write('district: $district, ')
          ..write('raw: $raw, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SamplesTable extends Samples with TableInfo<$SamplesTable, Sample> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SamplesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _sampleIdMeta =
      const VerificationMeta('sampleId');
  @override
  late final GeneratedColumn<String> sampleId = GeneratedColumn<String>(
      'sample_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _sampleTypeMeta =
      const VerificationMeta('sampleType');
  @override
  late final GeneratedColumn<String> sampleType = GeneratedColumn<String>(
      'sample_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _diseaseProgramMeta =
      const VerificationMeta('diseaseProgram');
  @override
  late final GeneratedColumn<String> diseaseProgram = GeneratedColumn<String>(
      'disease_program', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _quantityMeta =
      const VerificationMeta('quantity');
  @override
  late final GeneratedColumn<int> quantity = GeneratedColumn<int>(
      'quantity', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _villageMeta =
      const VerificationMeta('village');
  @override
  late final GeneratedColumn<String> village = GeneratedColumn<String>(
      'village', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _patientAgeMeta =
      const VerificationMeta('patientAge');
  @override
  late final GeneratedColumn<int> patientAge = GeneratedColumn<int>(
      'patient_age', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _patientGenderMeta =
      const VerificationMeta('patientGender');
  @override
  late final GeneratedColumn<String> patientGender = GeneratedColumn<String>(
      'patient_gender', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _qrCodeMeta = const VerificationMeta('qrCode');
  @override
  late final GeneratedColumn<String> qrCode = GeneratedColumn<String>(
      'qr_code', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _facilityIdMeta =
      const VerificationMeta('facilityId');
  @override
  late final GeneratedColumn<String> facilityId = GeneratedColumn<String>(
      'facility_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _collectedByIdMeta =
      const VerificationMeta('collectedById');
  @override
  late final GeneratedColumn<String> collectedById = GeneratedColumn<String>(
      'collected_by_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _dispatcherIdMeta =
      const VerificationMeta('dispatcherId');
  @override
  late final GeneratedColumn<String> dispatcherId = GeneratedColumn<String>(
      'dispatcher_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _dispatchIdMeta =
      const VerificationMeta('dispatchId');
  @override
  late final GeneratedColumn<String> dispatchId = GeneratedColumn<String>(
      'dispatch_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _collectedAtMeta =
      const VerificationMeta('collectedAt');
  @override
  late final GeneratedColumn<DateTime> collectedAt = GeneratedColumn<DateTime>(
      'collected_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _completedAtMeta =
      const VerificationMeta('completedAt');
  @override
  late final GeneratedColumn<DateTime> completedAt = GeneratedColumn<DateTime>(
      'completed_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _rawMeta = const VerificationMeta('raw');
  @override
  late final GeneratedColumn<String> raw = GeneratedColumn<String>(
      'raw', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _dirtyMeta = const VerificationMeta('dirty');
  @override
  late final GeneratedColumn<bool> dirty = GeneratedColumn<bool>(
      'dirty', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("dirty" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _deletedMeta =
      const VerificationMeta('deleted');
  @override
  late final GeneratedColumn<bool> deleted = GeneratedColumn<bool>(
      'deleted', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("deleted" IN (0, 1))'),
      defaultValue: const Constant(false));
  @override
  List<GeneratedColumn> get $columns => [
        id,
        sampleId,
        sampleType,
        status,
        diseaseProgram,
        quantity,
        village,
        patientAge,
        patientGender,
        notes,
        qrCode,
        facilityId,
        collectedById,
        dispatcherId,
        dispatchId,
        collectedAt,
        completedAt,
        createdAt,
        raw,
        dirty,
        deleted
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'samples';
  @override
  VerificationContext validateIntegrity(Insertable<Sample> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('sample_id')) {
      context.handle(_sampleIdMeta,
          sampleId.isAcceptableOrUnknown(data['sample_id']!, _sampleIdMeta));
    } else if (isInserting) {
      context.missing(_sampleIdMeta);
    }
    if (data.containsKey('sample_type')) {
      context.handle(
          _sampleTypeMeta,
          sampleType.isAcceptableOrUnknown(
              data['sample_type']!, _sampleTypeMeta));
    } else if (isInserting) {
      context.missing(_sampleTypeMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('disease_program')) {
      context.handle(
          _diseaseProgramMeta,
          diseaseProgram.isAcceptableOrUnknown(
              data['disease_program']!, _diseaseProgramMeta));
    } else if (isInserting) {
      context.missing(_diseaseProgramMeta);
    }
    if (data.containsKey('quantity')) {
      context.handle(_quantityMeta,
          quantity.isAcceptableOrUnknown(data['quantity']!, _quantityMeta));
    }
    if (data.containsKey('village')) {
      context.handle(_villageMeta,
          village.isAcceptableOrUnknown(data['village']!, _villageMeta));
    }
    if (data.containsKey('patient_age')) {
      context.handle(
          _patientAgeMeta,
          patientAge.isAcceptableOrUnknown(
              data['patient_age']!, _patientAgeMeta));
    }
    if (data.containsKey('patient_gender')) {
      context.handle(
          _patientGenderMeta,
          patientGender.isAcceptableOrUnknown(
              data['patient_gender']!, _patientGenderMeta));
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    }
    if (data.containsKey('qr_code')) {
      context.handle(_qrCodeMeta,
          qrCode.isAcceptableOrUnknown(data['qr_code']!, _qrCodeMeta));
    }
    if (data.containsKey('facility_id')) {
      context.handle(
          _facilityIdMeta,
          facilityId.isAcceptableOrUnknown(
              data['facility_id']!, _facilityIdMeta));
    }
    if (data.containsKey('collected_by_id')) {
      context.handle(
          _collectedByIdMeta,
          collectedById.isAcceptableOrUnknown(
              data['collected_by_id']!, _collectedByIdMeta));
    }
    if (data.containsKey('dispatcher_id')) {
      context.handle(
          _dispatcherIdMeta,
          dispatcherId.isAcceptableOrUnknown(
              data['dispatcher_id']!, _dispatcherIdMeta));
    }
    if (data.containsKey('dispatch_id')) {
      context.handle(
          _dispatchIdMeta,
          dispatchId.isAcceptableOrUnknown(
              data['dispatch_id']!, _dispatchIdMeta));
    }
    if (data.containsKey('collected_at')) {
      context.handle(
          _collectedAtMeta,
          collectedAt.isAcceptableOrUnknown(
              data['collected_at']!, _collectedAtMeta));
    }
    if (data.containsKey('completed_at')) {
      context.handle(
          _completedAtMeta,
          completedAt.isAcceptableOrUnknown(
              data['completed_at']!, _completedAtMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('raw')) {
      context.handle(
          _rawMeta, raw.isAcceptableOrUnknown(data['raw']!, _rawMeta));
    }
    if (data.containsKey('dirty')) {
      context.handle(
          _dirtyMeta, dirty.isAcceptableOrUnknown(data['dirty']!, _dirtyMeta));
    }
    if (data.containsKey('deleted')) {
      context.handle(_deletedMeta,
          deleted.isAcceptableOrUnknown(data['deleted']!, _deletedMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Sample map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Sample(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      sampleId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sample_id'])!,
      sampleType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sample_type'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      diseaseProgram: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}disease_program'])!,
      quantity: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}quantity'])!,
      village: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}village']),
      patientAge: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}patient_age']),
      patientGender: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}patient_gender']),
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes']),
      qrCode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}qr_code']),
      facilityId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}facility_id']),
      collectedById: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}collected_by_id']),
      dispatcherId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}dispatcher_id']),
      dispatchId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}dispatch_id']),
      collectedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}collected_at']),
      completedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}completed_at']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at']),
      raw: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}raw']),
      dirty: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}dirty'])!,
      deleted: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}deleted'])!,
    );
  }

  @override
  $SamplesTable createAlias(String alias) {
    return $SamplesTable(attachedDatabase, alias);
  }
}

class Sample extends DataClass implements Insertable<Sample> {
  final String id;
  final String sampleId;
  final String sampleType;
  final String status;
  final String diseaseProgram;
  final int quantity;
  final String? village;
  final int? patientAge;
  final String? patientGender;
  final String? notes;
  final String? qrCode;
  final String? facilityId;
  final String? collectedById;
  final String? dispatcherId;
  final String? dispatchId;
  final DateTime? collectedAt;
  final DateTime? completedAt;
  final DateTime? createdAt;
  final String? raw;
  final bool dirty;
  final bool deleted;
  const Sample(
      {required this.id,
      required this.sampleId,
      required this.sampleType,
      required this.status,
      required this.diseaseProgram,
      required this.quantity,
      this.village,
      this.patientAge,
      this.patientGender,
      this.notes,
      this.qrCode,
      this.facilityId,
      this.collectedById,
      this.dispatcherId,
      this.dispatchId,
      this.collectedAt,
      this.completedAt,
      this.createdAt,
      this.raw,
      required this.dirty,
      required this.deleted});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['sample_id'] = Variable<String>(sampleId);
    map['sample_type'] = Variable<String>(sampleType);
    map['status'] = Variable<String>(status);
    map['disease_program'] = Variable<String>(diseaseProgram);
    map['quantity'] = Variable<int>(quantity);
    if (!nullToAbsent || village != null) {
      map['village'] = Variable<String>(village);
    }
    if (!nullToAbsent || patientAge != null) {
      map['patient_age'] = Variable<int>(patientAge);
    }
    if (!nullToAbsent || patientGender != null) {
      map['patient_gender'] = Variable<String>(patientGender);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    if (!nullToAbsent || qrCode != null) {
      map['qr_code'] = Variable<String>(qrCode);
    }
    if (!nullToAbsent || facilityId != null) {
      map['facility_id'] = Variable<String>(facilityId);
    }
    if (!nullToAbsent || collectedById != null) {
      map['collected_by_id'] = Variable<String>(collectedById);
    }
    if (!nullToAbsent || dispatcherId != null) {
      map['dispatcher_id'] = Variable<String>(dispatcherId);
    }
    if (!nullToAbsent || dispatchId != null) {
      map['dispatch_id'] = Variable<String>(dispatchId);
    }
    if (!nullToAbsent || collectedAt != null) {
      map['collected_at'] = Variable<DateTime>(collectedAt);
    }
    if (!nullToAbsent || completedAt != null) {
      map['completed_at'] = Variable<DateTime>(completedAt);
    }
    if (!nullToAbsent || createdAt != null) {
      map['created_at'] = Variable<DateTime>(createdAt);
    }
    if (!nullToAbsent || raw != null) {
      map['raw'] = Variable<String>(raw);
    }
    map['dirty'] = Variable<bool>(dirty);
    map['deleted'] = Variable<bool>(deleted);
    return map;
  }

  SamplesCompanion toCompanion(bool nullToAbsent) {
    return SamplesCompanion(
      id: Value(id),
      sampleId: Value(sampleId),
      sampleType: Value(sampleType),
      status: Value(status),
      diseaseProgram: Value(diseaseProgram),
      quantity: Value(quantity),
      village: village == null && nullToAbsent
          ? const Value.absent()
          : Value(village),
      patientAge: patientAge == null && nullToAbsent
          ? const Value.absent()
          : Value(patientAge),
      patientGender: patientGender == null && nullToAbsent
          ? const Value.absent()
          : Value(patientGender),
      notes:
          notes == null && nullToAbsent ? const Value.absent() : Value(notes),
      qrCode:
          qrCode == null && nullToAbsent ? const Value.absent() : Value(qrCode),
      facilityId: facilityId == null && nullToAbsent
          ? const Value.absent()
          : Value(facilityId),
      collectedById: collectedById == null && nullToAbsent
          ? const Value.absent()
          : Value(collectedById),
      dispatcherId: dispatcherId == null && nullToAbsent
          ? const Value.absent()
          : Value(dispatcherId),
      dispatchId: dispatchId == null && nullToAbsent
          ? const Value.absent()
          : Value(dispatchId),
      collectedAt: collectedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(collectedAt),
      completedAt: completedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(completedAt),
      createdAt: createdAt == null && nullToAbsent
          ? const Value.absent()
          : Value(createdAt),
      raw: raw == null && nullToAbsent ? const Value.absent() : Value(raw),
      dirty: Value(dirty),
      deleted: Value(deleted),
    );
  }

  factory Sample.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Sample(
      id: serializer.fromJson<String>(json['id']),
      sampleId: serializer.fromJson<String>(json['sampleId']),
      sampleType: serializer.fromJson<String>(json['sampleType']),
      status: serializer.fromJson<String>(json['status']),
      diseaseProgram: serializer.fromJson<String>(json['diseaseProgram']),
      quantity: serializer.fromJson<int>(json['quantity']),
      village: serializer.fromJson<String?>(json['village']),
      patientAge: serializer.fromJson<int?>(json['patientAge']),
      patientGender: serializer.fromJson<String?>(json['patientGender']),
      notes: serializer.fromJson<String?>(json['notes']),
      qrCode: serializer.fromJson<String?>(json['qrCode']),
      facilityId: serializer.fromJson<String?>(json['facilityId']),
      collectedById: serializer.fromJson<String?>(json['collectedById']),
      dispatcherId: serializer.fromJson<String?>(json['dispatcherId']),
      dispatchId: serializer.fromJson<String?>(json['dispatchId']),
      collectedAt: serializer.fromJson<DateTime?>(json['collectedAt']),
      completedAt: serializer.fromJson<DateTime?>(json['completedAt']),
      createdAt: serializer.fromJson<DateTime?>(json['createdAt']),
      raw: serializer.fromJson<String?>(json['raw']),
      dirty: serializer.fromJson<bool>(json['dirty']),
      deleted: serializer.fromJson<bool>(json['deleted']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'sampleId': serializer.toJson<String>(sampleId),
      'sampleType': serializer.toJson<String>(sampleType),
      'status': serializer.toJson<String>(status),
      'diseaseProgram': serializer.toJson<String>(diseaseProgram),
      'quantity': serializer.toJson<int>(quantity),
      'village': serializer.toJson<String?>(village),
      'patientAge': serializer.toJson<int?>(patientAge),
      'patientGender': serializer.toJson<String?>(patientGender),
      'notes': serializer.toJson<String?>(notes),
      'qrCode': serializer.toJson<String?>(qrCode),
      'facilityId': serializer.toJson<String?>(facilityId),
      'collectedById': serializer.toJson<String?>(collectedById),
      'dispatcherId': serializer.toJson<String?>(dispatcherId),
      'dispatchId': serializer.toJson<String?>(dispatchId),
      'collectedAt': serializer.toJson<DateTime?>(collectedAt),
      'completedAt': serializer.toJson<DateTime?>(completedAt),
      'createdAt': serializer.toJson<DateTime?>(createdAt),
      'raw': serializer.toJson<String?>(raw),
      'dirty': serializer.toJson<bool>(dirty),
      'deleted': serializer.toJson<bool>(deleted),
    };
  }

  Sample copyWith(
          {String? id,
          String? sampleId,
          String? sampleType,
          String? status,
          String? diseaseProgram,
          int? quantity,
          Value<String?> village = const Value.absent(),
          Value<int?> patientAge = const Value.absent(),
          Value<String?> patientGender = const Value.absent(),
          Value<String?> notes = const Value.absent(),
          Value<String?> qrCode = const Value.absent(),
          Value<String?> facilityId = const Value.absent(),
          Value<String?> collectedById = const Value.absent(),
          Value<String?> dispatcherId = const Value.absent(),
          Value<String?> dispatchId = const Value.absent(),
          Value<DateTime?> collectedAt = const Value.absent(),
          Value<DateTime?> completedAt = const Value.absent(),
          Value<DateTime?> createdAt = const Value.absent(),
          Value<String?> raw = const Value.absent(),
          bool? dirty,
          bool? deleted}) =>
      Sample(
        id: id ?? this.id,
        sampleId: sampleId ?? this.sampleId,
        sampleType: sampleType ?? this.sampleType,
        status: status ?? this.status,
        diseaseProgram: diseaseProgram ?? this.diseaseProgram,
        quantity: quantity ?? this.quantity,
        village: village.present ? village.value : this.village,
        patientAge: patientAge.present ? patientAge.value : this.patientAge,
        patientGender:
            patientGender.present ? patientGender.value : this.patientGender,
        notes: notes.present ? notes.value : this.notes,
        qrCode: qrCode.present ? qrCode.value : this.qrCode,
        facilityId: facilityId.present ? facilityId.value : this.facilityId,
        collectedById:
            collectedById.present ? collectedById.value : this.collectedById,
        dispatcherId:
            dispatcherId.present ? dispatcherId.value : this.dispatcherId,
        dispatchId: dispatchId.present ? dispatchId.value : this.dispatchId,
        collectedAt: collectedAt.present ? collectedAt.value : this.collectedAt,
        completedAt: completedAt.present ? completedAt.value : this.completedAt,
        createdAt: createdAt.present ? createdAt.value : this.createdAt,
        raw: raw.present ? raw.value : this.raw,
        dirty: dirty ?? this.dirty,
        deleted: deleted ?? this.deleted,
      );
  Sample copyWithCompanion(SamplesCompanion data) {
    return Sample(
      id: data.id.present ? data.id.value : this.id,
      sampleId: data.sampleId.present ? data.sampleId.value : this.sampleId,
      sampleType:
          data.sampleType.present ? data.sampleType.value : this.sampleType,
      status: data.status.present ? data.status.value : this.status,
      diseaseProgram: data.diseaseProgram.present
          ? data.diseaseProgram.value
          : this.diseaseProgram,
      quantity: data.quantity.present ? data.quantity.value : this.quantity,
      village: data.village.present ? data.village.value : this.village,
      patientAge:
          data.patientAge.present ? data.patientAge.value : this.patientAge,
      patientGender: data.patientGender.present
          ? data.patientGender.value
          : this.patientGender,
      notes: data.notes.present ? data.notes.value : this.notes,
      qrCode: data.qrCode.present ? data.qrCode.value : this.qrCode,
      facilityId:
          data.facilityId.present ? data.facilityId.value : this.facilityId,
      collectedById: data.collectedById.present
          ? data.collectedById.value
          : this.collectedById,
      dispatcherId: data.dispatcherId.present
          ? data.dispatcherId.value
          : this.dispatcherId,
      dispatchId:
          data.dispatchId.present ? data.dispatchId.value : this.dispatchId,
      collectedAt:
          data.collectedAt.present ? data.collectedAt.value : this.collectedAt,
      completedAt:
          data.completedAt.present ? data.completedAt.value : this.completedAt,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      raw: data.raw.present ? data.raw.value : this.raw,
      dirty: data.dirty.present ? data.dirty.value : this.dirty,
      deleted: data.deleted.present ? data.deleted.value : this.deleted,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Sample(')
          ..write('id: $id, ')
          ..write('sampleId: $sampleId, ')
          ..write('sampleType: $sampleType, ')
          ..write('status: $status, ')
          ..write('diseaseProgram: $diseaseProgram, ')
          ..write('quantity: $quantity, ')
          ..write('village: $village, ')
          ..write('patientAge: $patientAge, ')
          ..write('patientGender: $patientGender, ')
          ..write('notes: $notes, ')
          ..write('qrCode: $qrCode, ')
          ..write('facilityId: $facilityId, ')
          ..write('collectedById: $collectedById, ')
          ..write('dispatcherId: $dispatcherId, ')
          ..write('dispatchId: $dispatchId, ')
          ..write('collectedAt: $collectedAt, ')
          ..write('completedAt: $completedAt, ')
          ..write('createdAt: $createdAt, ')
          ..write('raw: $raw, ')
          ..write('dirty: $dirty, ')
          ..write('deleted: $deleted')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
        id,
        sampleId,
        sampleType,
        status,
        diseaseProgram,
        quantity,
        village,
        patientAge,
        patientGender,
        notes,
        qrCode,
        facilityId,
        collectedById,
        dispatcherId,
        dispatchId,
        collectedAt,
        completedAt,
        createdAt,
        raw,
        dirty,
        deleted
      ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Sample &&
          other.id == this.id &&
          other.sampleId == this.sampleId &&
          other.sampleType == this.sampleType &&
          other.status == this.status &&
          other.diseaseProgram == this.diseaseProgram &&
          other.quantity == this.quantity &&
          other.village == this.village &&
          other.patientAge == this.patientAge &&
          other.patientGender == this.patientGender &&
          other.notes == this.notes &&
          other.qrCode == this.qrCode &&
          other.facilityId == this.facilityId &&
          other.collectedById == this.collectedById &&
          other.dispatcherId == this.dispatcherId &&
          other.dispatchId == this.dispatchId &&
          other.collectedAt == this.collectedAt &&
          other.completedAt == this.completedAt &&
          other.createdAt == this.createdAt &&
          other.raw == this.raw &&
          other.dirty == this.dirty &&
          other.deleted == this.deleted);
}

class SamplesCompanion extends UpdateCompanion<Sample> {
  final Value<String> id;
  final Value<String> sampleId;
  final Value<String> sampleType;
  final Value<String> status;
  final Value<String> diseaseProgram;
  final Value<int> quantity;
  final Value<String?> village;
  final Value<int?> patientAge;
  final Value<String?> patientGender;
  final Value<String?> notes;
  final Value<String?> qrCode;
  final Value<String?> facilityId;
  final Value<String?> collectedById;
  final Value<String?> dispatcherId;
  final Value<String?> dispatchId;
  final Value<DateTime?> collectedAt;
  final Value<DateTime?> completedAt;
  final Value<DateTime?> createdAt;
  final Value<String?> raw;
  final Value<bool> dirty;
  final Value<bool> deleted;
  final Value<int> rowid;
  const SamplesCompanion({
    this.id = const Value.absent(),
    this.sampleId = const Value.absent(),
    this.sampleType = const Value.absent(),
    this.status = const Value.absent(),
    this.diseaseProgram = const Value.absent(),
    this.quantity = const Value.absent(),
    this.village = const Value.absent(),
    this.patientAge = const Value.absent(),
    this.patientGender = const Value.absent(),
    this.notes = const Value.absent(),
    this.qrCode = const Value.absent(),
    this.facilityId = const Value.absent(),
    this.collectedById = const Value.absent(),
    this.dispatcherId = const Value.absent(),
    this.dispatchId = const Value.absent(),
    this.collectedAt = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.raw = const Value.absent(),
    this.dirty = const Value.absent(),
    this.deleted = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SamplesCompanion.insert({
    required String id,
    required String sampleId,
    required String sampleType,
    required String status,
    required String diseaseProgram,
    this.quantity = const Value.absent(),
    this.village = const Value.absent(),
    this.patientAge = const Value.absent(),
    this.patientGender = const Value.absent(),
    this.notes = const Value.absent(),
    this.qrCode = const Value.absent(),
    this.facilityId = const Value.absent(),
    this.collectedById = const Value.absent(),
    this.dispatcherId = const Value.absent(),
    this.dispatchId = const Value.absent(),
    this.collectedAt = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.raw = const Value.absent(),
    this.dirty = const Value.absent(),
    this.deleted = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        sampleId = Value(sampleId),
        sampleType = Value(sampleType),
        status = Value(status),
        diseaseProgram = Value(diseaseProgram);
  static Insertable<Sample> custom({
    Expression<String>? id,
    Expression<String>? sampleId,
    Expression<String>? sampleType,
    Expression<String>? status,
    Expression<String>? diseaseProgram,
    Expression<int>? quantity,
    Expression<String>? village,
    Expression<int>? patientAge,
    Expression<String>? patientGender,
    Expression<String>? notes,
    Expression<String>? qrCode,
    Expression<String>? facilityId,
    Expression<String>? collectedById,
    Expression<String>? dispatcherId,
    Expression<String>? dispatchId,
    Expression<DateTime>? collectedAt,
    Expression<DateTime>? completedAt,
    Expression<DateTime>? createdAt,
    Expression<String>? raw,
    Expression<bool>? dirty,
    Expression<bool>? deleted,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (sampleId != null) 'sample_id': sampleId,
      if (sampleType != null) 'sample_type': sampleType,
      if (status != null) 'status': status,
      if (diseaseProgram != null) 'disease_program': diseaseProgram,
      if (quantity != null) 'quantity': quantity,
      if (village != null) 'village': village,
      if (patientAge != null) 'patient_age': patientAge,
      if (patientGender != null) 'patient_gender': patientGender,
      if (notes != null) 'notes': notes,
      if (qrCode != null) 'qr_code': qrCode,
      if (facilityId != null) 'facility_id': facilityId,
      if (collectedById != null) 'collected_by_id': collectedById,
      if (dispatcherId != null) 'dispatcher_id': dispatcherId,
      if (dispatchId != null) 'dispatch_id': dispatchId,
      if (collectedAt != null) 'collected_at': collectedAt,
      if (completedAt != null) 'completed_at': completedAt,
      if (createdAt != null) 'created_at': createdAt,
      if (raw != null) 'raw': raw,
      if (dirty != null) 'dirty': dirty,
      if (deleted != null) 'deleted': deleted,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SamplesCompanion copyWith(
      {Value<String>? id,
      Value<String>? sampleId,
      Value<String>? sampleType,
      Value<String>? status,
      Value<String>? diseaseProgram,
      Value<int>? quantity,
      Value<String?>? village,
      Value<int?>? patientAge,
      Value<String?>? patientGender,
      Value<String?>? notes,
      Value<String?>? qrCode,
      Value<String?>? facilityId,
      Value<String?>? collectedById,
      Value<String?>? dispatcherId,
      Value<String?>? dispatchId,
      Value<DateTime?>? collectedAt,
      Value<DateTime?>? completedAt,
      Value<DateTime?>? createdAt,
      Value<String?>? raw,
      Value<bool>? dirty,
      Value<bool>? deleted,
      Value<int>? rowid}) {
    return SamplesCompanion(
      id: id ?? this.id,
      sampleId: sampleId ?? this.sampleId,
      sampleType: sampleType ?? this.sampleType,
      status: status ?? this.status,
      diseaseProgram: diseaseProgram ?? this.diseaseProgram,
      quantity: quantity ?? this.quantity,
      village: village ?? this.village,
      patientAge: patientAge ?? this.patientAge,
      patientGender: patientGender ?? this.patientGender,
      notes: notes ?? this.notes,
      qrCode: qrCode ?? this.qrCode,
      facilityId: facilityId ?? this.facilityId,
      collectedById: collectedById ?? this.collectedById,
      dispatcherId: dispatcherId ?? this.dispatcherId,
      dispatchId: dispatchId ?? this.dispatchId,
      collectedAt: collectedAt ?? this.collectedAt,
      completedAt: completedAt ?? this.completedAt,
      createdAt: createdAt ?? this.createdAt,
      raw: raw ?? this.raw,
      dirty: dirty ?? this.dirty,
      deleted: deleted ?? this.deleted,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (sampleId.present) {
      map['sample_id'] = Variable<String>(sampleId.value);
    }
    if (sampleType.present) {
      map['sample_type'] = Variable<String>(sampleType.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (diseaseProgram.present) {
      map['disease_program'] = Variable<String>(diseaseProgram.value);
    }
    if (quantity.present) {
      map['quantity'] = Variable<int>(quantity.value);
    }
    if (village.present) {
      map['village'] = Variable<String>(village.value);
    }
    if (patientAge.present) {
      map['patient_age'] = Variable<int>(patientAge.value);
    }
    if (patientGender.present) {
      map['patient_gender'] = Variable<String>(patientGender.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (qrCode.present) {
      map['qr_code'] = Variable<String>(qrCode.value);
    }
    if (facilityId.present) {
      map['facility_id'] = Variable<String>(facilityId.value);
    }
    if (collectedById.present) {
      map['collected_by_id'] = Variable<String>(collectedById.value);
    }
    if (dispatcherId.present) {
      map['dispatcher_id'] = Variable<String>(dispatcherId.value);
    }
    if (dispatchId.present) {
      map['dispatch_id'] = Variable<String>(dispatchId.value);
    }
    if (collectedAt.present) {
      map['collected_at'] = Variable<DateTime>(collectedAt.value);
    }
    if (completedAt.present) {
      map['completed_at'] = Variable<DateTime>(completedAt.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (raw.present) {
      map['raw'] = Variable<String>(raw.value);
    }
    if (dirty.present) {
      map['dirty'] = Variable<bool>(dirty.value);
    }
    if (deleted.present) {
      map['deleted'] = Variable<bool>(deleted.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SamplesCompanion(')
          ..write('id: $id, ')
          ..write('sampleId: $sampleId, ')
          ..write('sampleType: $sampleType, ')
          ..write('status: $status, ')
          ..write('diseaseProgram: $diseaseProgram, ')
          ..write('quantity: $quantity, ')
          ..write('village: $village, ')
          ..write('patientAge: $patientAge, ')
          ..write('patientGender: $patientGender, ')
          ..write('notes: $notes, ')
          ..write('qrCode: $qrCode, ')
          ..write('facilityId: $facilityId, ')
          ..write('collectedById: $collectedById, ')
          ..write('dispatcherId: $dispatcherId, ')
          ..write('dispatchId: $dispatchId, ')
          ..write('collectedAt: $collectedAt, ')
          ..write('completedAt: $completedAt, ')
          ..write('createdAt: $createdAt, ')
          ..write('raw: $raw, ')
          ..write('dirty: $dirty, ')
          ..write('deleted: $deleted, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $DispatchesTable extends Dispatches
    with TableInfo<$DispatchesTable, Dispatche> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DispatchesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _dispatchIdMeta =
      const VerificationMeta('dispatchId');
  @override
  late final GeneratedColumn<String> dispatchId = GeneratedColumn<String>(
      'dispatch_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _sampleCountMeta =
      const VerificationMeta('sampleCount');
  @override
  late final GeneratedColumn<int> sampleCount = GeneratedColumn<int>(
      'sample_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _coolerIdMeta =
      const VerificationMeta('coolerId');
  @override
  late final GeneratedColumn<String> coolerId = GeneratedColumn<String>(
      'cooler_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _riderIdMeta =
      const VerificationMeta('riderId');
  @override
  late final GeneratedColumn<String> riderId = GeneratedColumn<String>(
      'rider_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _originFacilityIdMeta =
      const VerificationMeta('originFacilityId');
  @override
  late final GeneratedColumn<String> originFacilityId = GeneratedColumn<String>(
      'origin_facility_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _destinationFacilityIdMeta =
      const VerificationMeta('destinationFacilityId');
  @override
  late final GeneratedColumn<String> destinationFacilityId =
      GeneratedColumn<String>('destination_facility_id', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _rawMeta = const VerificationMeta('raw');
  @override
  late final GeneratedColumn<String> raw = GeneratedColumn<String>(
      'raw', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _dirtyMeta = const VerificationMeta('dirty');
  @override
  late final GeneratedColumn<bool> dirty = GeneratedColumn<bool>(
      'dirty', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("dirty" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _deletedMeta =
      const VerificationMeta('deleted');
  @override
  late final GeneratedColumn<bool> deleted = GeneratedColumn<bool>(
      'deleted', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("deleted" IN (0, 1))'),
      defaultValue: const Constant(false));
  @override
  List<GeneratedColumn> get $columns => [
        id,
        dispatchId,
        status,
        sampleCount,
        coolerId,
        riderId,
        originFacilityId,
        destinationFacilityId,
        createdAt,
        raw,
        dirty,
        deleted
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'dispatches';
  @override
  VerificationContext validateIntegrity(Insertable<Dispatche> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('dispatch_id')) {
      context.handle(
          _dispatchIdMeta,
          dispatchId.isAcceptableOrUnknown(
              data['dispatch_id']!, _dispatchIdMeta));
    } else if (isInserting) {
      context.missing(_dispatchIdMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('sample_count')) {
      context.handle(
          _sampleCountMeta,
          sampleCount.isAcceptableOrUnknown(
              data['sample_count']!, _sampleCountMeta));
    }
    if (data.containsKey('cooler_id')) {
      context.handle(_coolerIdMeta,
          coolerId.isAcceptableOrUnknown(data['cooler_id']!, _coolerIdMeta));
    }
    if (data.containsKey('rider_id')) {
      context.handle(_riderIdMeta,
          riderId.isAcceptableOrUnknown(data['rider_id']!, _riderIdMeta));
    }
    if (data.containsKey('origin_facility_id')) {
      context.handle(
          _originFacilityIdMeta,
          originFacilityId.isAcceptableOrUnknown(
              data['origin_facility_id']!, _originFacilityIdMeta));
    }
    if (data.containsKey('destination_facility_id')) {
      context.handle(
          _destinationFacilityIdMeta,
          destinationFacilityId.isAcceptableOrUnknown(
              data['destination_facility_id']!, _destinationFacilityIdMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('raw')) {
      context.handle(
          _rawMeta, raw.isAcceptableOrUnknown(data['raw']!, _rawMeta));
    }
    if (data.containsKey('dirty')) {
      context.handle(
          _dirtyMeta, dirty.isAcceptableOrUnknown(data['dirty']!, _dirtyMeta));
    }
    if (data.containsKey('deleted')) {
      context.handle(_deletedMeta,
          deleted.isAcceptableOrUnknown(data['deleted']!, _deletedMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Dispatche map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Dispatche(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      dispatchId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}dispatch_id'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      sampleCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sample_count'])!,
      coolerId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}cooler_id']),
      riderId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}rider_id']),
      originFacilityId: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}origin_facility_id']),
      destinationFacilityId: attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}destination_facility_id']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at']),
      raw: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}raw']),
      dirty: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}dirty'])!,
      deleted: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}deleted'])!,
    );
  }

  @override
  $DispatchesTable createAlias(String alias) {
    return $DispatchesTable(attachedDatabase, alias);
  }
}

class Dispatche extends DataClass implements Insertable<Dispatche> {
  final String id;
  final String dispatchId;
  final String status;
  final int sampleCount;
  final String? coolerId;
  final String? riderId;
  final String? originFacilityId;
  final String? destinationFacilityId;
  final DateTime? createdAt;
  final String? raw;
  final bool dirty;
  final bool deleted;
  const Dispatche(
      {required this.id,
      required this.dispatchId,
      required this.status,
      required this.sampleCount,
      this.coolerId,
      this.riderId,
      this.originFacilityId,
      this.destinationFacilityId,
      this.createdAt,
      this.raw,
      required this.dirty,
      required this.deleted});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['dispatch_id'] = Variable<String>(dispatchId);
    map['status'] = Variable<String>(status);
    map['sample_count'] = Variable<int>(sampleCount);
    if (!nullToAbsent || coolerId != null) {
      map['cooler_id'] = Variable<String>(coolerId);
    }
    if (!nullToAbsent || riderId != null) {
      map['rider_id'] = Variable<String>(riderId);
    }
    if (!nullToAbsent || originFacilityId != null) {
      map['origin_facility_id'] = Variable<String>(originFacilityId);
    }
    if (!nullToAbsent || destinationFacilityId != null) {
      map['destination_facility_id'] = Variable<String>(destinationFacilityId);
    }
    if (!nullToAbsent || createdAt != null) {
      map['created_at'] = Variable<DateTime>(createdAt);
    }
    if (!nullToAbsent || raw != null) {
      map['raw'] = Variable<String>(raw);
    }
    map['dirty'] = Variable<bool>(dirty);
    map['deleted'] = Variable<bool>(deleted);
    return map;
  }

  DispatchesCompanion toCompanion(bool nullToAbsent) {
    return DispatchesCompanion(
      id: Value(id),
      dispatchId: Value(dispatchId),
      status: Value(status),
      sampleCount: Value(sampleCount),
      coolerId: coolerId == null && nullToAbsent
          ? const Value.absent()
          : Value(coolerId),
      riderId: riderId == null && nullToAbsent
          ? const Value.absent()
          : Value(riderId),
      originFacilityId: originFacilityId == null && nullToAbsent
          ? const Value.absent()
          : Value(originFacilityId),
      destinationFacilityId: destinationFacilityId == null && nullToAbsent
          ? const Value.absent()
          : Value(destinationFacilityId),
      createdAt: createdAt == null && nullToAbsent
          ? const Value.absent()
          : Value(createdAt),
      raw: raw == null && nullToAbsent ? const Value.absent() : Value(raw),
      dirty: Value(dirty),
      deleted: Value(deleted),
    );
  }

  factory Dispatche.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Dispatche(
      id: serializer.fromJson<String>(json['id']),
      dispatchId: serializer.fromJson<String>(json['dispatchId']),
      status: serializer.fromJson<String>(json['status']),
      sampleCount: serializer.fromJson<int>(json['sampleCount']),
      coolerId: serializer.fromJson<String?>(json['coolerId']),
      riderId: serializer.fromJson<String?>(json['riderId']),
      originFacilityId: serializer.fromJson<String?>(json['originFacilityId']),
      destinationFacilityId:
          serializer.fromJson<String?>(json['destinationFacilityId']),
      createdAt: serializer.fromJson<DateTime?>(json['createdAt']),
      raw: serializer.fromJson<String?>(json['raw']),
      dirty: serializer.fromJson<bool>(json['dirty']),
      deleted: serializer.fromJson<bool>(json['deleted']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'dispatchId': serializer.toJson<String>(dispatchId),
      'status': serializer.toJson<String>(status),
      'sampleCount': serializer.toJson<int>(sampleCount),
      'coolerId': serializer.toJson<String?>(coolerId),
      'riderId': serializer.toJson<String?>(riderId),
      'originFacilityId': serializer.toJson<String?>(originFacilityId),
      'destinationFacilityId':
          serializer.toJson<String?>(destinationFacilityId),
      'createdAt': serializer.toJson<DateTime?>(createdAt),
      'raw': serializer.toJson<String?>(raw),
      'dirty': serializer.toJson<bool>(dirty),
      'deleted': serializer.toJson<bool>(deleted),
    };
  }

  Dispatche copyWith(
          {String? id,
          String? dispatchId,
          String? status,
          int? sampleCount,
          Value<String?> coolerId = const Value.absent(),
          Value<String?> riderId = const Value.absent(),
          Value<String?> originFacilityId = const Value.absent(),
          Value<String?> destinationFacilityId = const Value.absent(),
          Value<DateTime?> createdAt = const Value.absent(),
          Value<String?> raw = const Value.absent(),
          bool? dirty,
          bool? deleted}) =>
      Dispatche(
        id: id ?? this.id,
        dispatchId: dispatchId ?? this.dispatchId,
        status: status ?? this.status,
        sampleCount: sampleCount ?? this.sampleCount,
        coolerId: coolerId.present ? coolerId.value : this.coolerId,
        riderId: riderId.present ? riderId.value : this.riderId,
        originFacilityId: originFacilityId.present
            ? originFacilityId.value
            : this.originFacilityId,
        destinationFacilityId: destinationFacilityId.present
            ? destinationFacilityId.value
            : this.destinationFacilityId,
        createdAt: createdAt.present ? createdAt.value : this.createdAt,
        raw: raw.present ? raw.value : this.raw,
        dirty: dirty ?? this.dirty,
        deleted: deleted ?? this.deleted,
      );
  Dispatche copyWithCompanion(DispatchesCompanion data) {
    return Dispatche(
      id: data.id.present ? data.id.value : this.id,
      dispatchId:
          data.dispatchId.present ? data.dispatchId.value : this.dispatchId,
      status: data.status.present ? data.status.value : this.status,
      sampleCount:
          data.sampleCount.present ? data.sampleCount.value : this.sampleCount,
      coolerId: data.coolerId.present ? data.coolerId.value : this.coolerId,
      riderId: data.riderId.present ? data.riderId.value : this.riderId,
      originFacilityId: data.originFacilityId.present
          ? data.originFacilityId.value
          : this.originFacilityId,
      destinationFacilityId: data.destinationFacilityId.present
          ? data.destinationFacilityId.value
          : this.destinationFacilityId,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      raw: data.raw.present ? data.raw.value : this.raw,
      dirty: data.dirty.present ? data.dirty.value : this.dirty,
      deleted: data.deleted.present ? data.deleted.value : this.deleted,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Dispatche(')
          ..write('id: $id, ')
          ..write('dispatchId: $dispatchId, ')
          ..write('status: $status, ')
          ..write('sampleCount: $sampleCount, ')
          ..write('coolerId: $coolerId, ')
          ..write('riderId: $riderId, ')
          ..write('originFacilityId: $originFacilityId, ')
          ..write('destinationFacilityId: $destinationFacilityId, ')
          ..write('createdAt: $createdAt, ')
          ..write('raw: $raw, ')
          ..write('dirty: $dirty, ')
          ..write('deleted: $deleted')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      dispatchId,
      status,
      sampleCount,
      coolerId,
      riderId,
      originFacilityId,
      destinationFacilityId,
      createdAt,
      raw,
      dirty,
      deleted);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Dispatche &&
          other.id == this.id &&
          other.dispatchId == this.dispatchId &&
          other.status == this.status &&
          other.sampleCount == this.sampleCount &&
          other.coolerId == this.coolerId &&
          other.riderId == this.riderId &&
          other.originFacilityId == this.originFacilityId &&
          other.destinationFacilityId == this.destinationFacilityId &&
          other.createdAt == this.createdAt &&
          other.raw == this.raw &&
          other.dirty == this.dirty &&
          other.deleted == this.deleted);
}

class DispatchesCompanion extends UpdateCompanion<Dispatche> {
  final Value<String> id;
  final Value<String> dispatchId;
  final Value<String> status;
  final Value<int> sampleCount;
  final Value<String?> coolerId;
  final Value<String?> riderId;
  final Value<String?> originFacilityId;
  final Value<String?> destinationFacilityId;
  final Value<DateTime?> createdAt;
  final Value<String?> raw;
  final Value<bool> dirty;
  final Value<bool> deleted;
  final Value<int> rowid;
  const DispatchesCompanion({
    this.id = const Value.absent(),
    this.dispatchId = const Value.absent(),
    this.status = const Value.absent(),
    this.sampleCount = const Value.absent(),
    this.coolerId = const Value.absent(),
    this.riderId = const Value.absent(),
    this.originFacilityId = const Value.absent(),
    this.destinationFacilityId = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.raw = const Value.absent(),
    this.dirty = const Value.absent(),
    this.deleted = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  DispatchesCompanion.insert({
    required String id,
    required String dispatchId,
    required String status,
    this.sampleCount = const Value.absent(),
    this.coolerId = const Value.absent(),
    this.riderId = const Value.absent(),
    this.originFacilityId = const Value.absent(),
    this.destinationFacilityId = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.raw = const Value.absent(),
    this.dirty = const Value.absent(),
    this.deleted = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        dispatchId = Value(dispatchId),
        status = Value(status);
  static Insertable<Dispatche> custom({
    Expression<String>? id,
    Expression<String>? dispatchId,
    Expression<String>? status,
    Expression<int>? sampleCount,
    Expression<String>? coolerId,
    Expression<String>? riderId,
    Expression<String>? originFacilityId,
    Expression<String>? destinationFacilityId,
    Expression<DateTime>? createdAt,
    Expression<String>? raw,
    Expression<bool>? dirty,
    Expression<bool>? deleted,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (dispatchId != null) 'dispatch_id': dispatchId,
      if (status != null) 'status': status,
      if (sampleCount != null) 'sample_count': sampleCount,
      if (coolerId != null) 'cooler_id': coolerId,
      if (riderId != null) 'rider_id': riderId,
      if (originFacilityId != null) 'origin_facility_id': originFacilityId,
      if (destinationFacilityId != null)
        'destination_facility_id': destinationFacilityId,
      if (createdAt != null) 'created_at': createdAt,
      if (raw != null) 'raw': raw,
      if (dirty != null) 'dirty': dirty,
      if (deleted != null) 'deleted': deleted,
      if (rowid != null) 'rowid': rowid,
    });
  }

  DispatchesCompanion copyWith(
      {Value<String>? id,
      Value<String>? dispatchId,
      Value<String>? status,
      Value<int>? sampleCount,
      Value<String?>? coolerId,
      Value<String?>? riderId,
      Value<String?>? originFacilityId,
      Value<String?>? destinationFacilityId,
      Value<DateTime?>? createdAt,
      Value<String?>? raw,
      Value<bool>? dirty,
      Value<bool>? deleted,
      Value<int>? rowid}) {
    return DispatchesCompanion(
      id: id ?? this.id,
      dispatchId: dispatchId ?? this.dispatchId,
      status: status ?? this.status,
      sampleCount: sampleCount ?? this.sampleCount,
      coolerId: coolerId ?? this.coolerId,
      riderId: riderId ?? this.riderId,
      originFacilityId: originFacilityId ?? this.originFacilityId,
      destinationFacilityId:
          destinationFacilityId ?? this.destinationFacilityId,
      createdAt: createdAt ?? this.createdAt,
      raw: raw ?? this.raw,
      dirty: dirty ?? this.dirty,
      deleted: deleted ?? this.deleted,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (dispatchId.present) {
      map['dispatch_id'] = Variable<String>(dispatchId.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (sampleCount.present) {
      map['sample_count'] = Variable<int>(sampleCount.value);
    }
    if (coolerId.present) {
      map['cooler_id'] = Variable<String>(coolerId.value);
    }
    if (riderId.present) {
      map['rider_id'] = Variable<String>(riderId.value);
    }
    if (originFacilityId.present) {
      map['origin_facility_id'] = Variable<String>(originFacilityId.value);
    }
    if (destinationFacilityId.present) {
      map['destination_facility_id'] =
          Variable<String>(destinationFacilityId.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (raw.present) {
      map['raw'] = Variable<String>(raw.value);
    }
    if (dirty.present) {
      map['dirty'] = Variable<bool>(dirty.value);
    }
    if (deleted.present) {
      map['deleted'] = Variable<bool>(deleted.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DispatchesCompanion(')
          ..write('id: $id, ')
          ..write('dispatchId: $dispatchId, ')
          ..write('status: $status, ')
          ..write('sampleCount: $sampleCount, ')
          ..write('coolerId: $coolerId, ')
          ..write('riderId: $riderId, ')
          ..write('originFacilityId: $originFacilityId, ')
          ..write('destinationFacilityId: $destinationFacilityId, ')
          ..write('createdAt: $createdAt, ')
          ..write('raw: $raw, ')
          ..write('dirty: $dirty, ')
          ..write('deleted: $deleted, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $EventLogsTable extends EventLogs
    with TableInfo<$EventLogsTable, EventLog> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $EventLogsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _eventMeta = const VerificationMeta('event');
  @override
  late final GeneratedColumn<String> event = GeneratedColumn<String>(
      'event', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _descriptionMeta =
      const VerificationMeta('description');
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
      'description', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _sampleIdMeta =
      const VerificationMeta('sampleId');
  @override
  late final GeneratedColumn<String> sampleId = GeneratedColumn<String>(
      'sample_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _dispatchIdMeta =
      const VerificationMeta('dispatchId');
  @override
  late final GeneratedColumn<String> dispatchId = GeneratedColumn<String>(
      'dispatch_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _timestampMeta =
      const VerificationMeta('timestamp');
  @override
  late final GeneratedColumn<DateTime> timestamp = GeneratedColumn<DateTime>(
      'timestamp', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _rawMeta = const VerificationMeta('raw');
  @override
  late final GeneratedColumn<String> raw = GeneratedColumn<String>(
      'raw', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns =>
      [id, event, description, sampleId, dispatchId, timestamp, raw];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'event_logs';
  @override
  VerificationContext validateIntegrity(Insertable<EventLog> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('event')) {
      context.handle(
          _eventMeta, event.isAcceptableOrUnknown(data['event']!, _eventMeta));
    } else if (isInserting) {
      context.missing(_eventMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
          _descriptionMeta,
          description.isAcceptableOrUnknown(
              data['description']!, _descriptionMeta));
    }
    if (data.containsKey('sample_id')) {
      context.handle(_sampleIdMeta,
          sampleId.isAcceptableOrUnknown(data['sample_id']!, _sampleIdMeta));
    }
    if (data.containsKey('dispatch_id')) {
      context.handle(
          _dispatchIdMeta,
          dispatchId.isAcceptableOrUnknown(
              data['dispatch_id']!, _dispatchIdMeta));
    }
    if (data.containsKey('timestamp')) {
      context.handle(_timestampMeta,
          timestamp.isAcceptableOrUnknown(data['timestamp']!, _timestampMeta));
    }
    if (data.containsKey('raw')) {
      context.handle(
          _rawMeta, raw.isAcceptableOrUnknown(data['raw']!, _rawMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  EventLog map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return EventLog(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      event: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}event'])!,
      description: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}description']),
      sampleId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sample_id']),
      dispatchId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}dispatch_id']),
      timestamp: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}timestamp']),
      raw: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}raw']),
    );
  }

  @override
  $EventLogsTable createAlias(String alias) {
    return $EventLogsTable(attachedDatabase, alias);
  }
}

class EventLog extends DataClass implements Insertable<EventLog> {
  final String id;
  final String event;
  final String? description;
  final String? sampleId;
  final String? dispatchId;
  final DateTime? timestamp;
  final String? raw;
  const EventLog(
      {required this.id,
      required this.event,
      this.description,
      this.sampleId,
      this.dispatchId,
      this.timestamp,
      this.raw});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['event'] = Variable<String>(event);
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    if (!nullToAbsent || sampleId != null) {
      map['sample_id'] = Variable<String>(sampleId);
    }
    if (!nullToAbsent || dispatchId != null) {
      map['dispatch_id'] = Variable<String>(dispatchId);
    }
    if (!nullToAbsent || timestamp != null) {
      map['timestamp'] = Variable<DateTime>(timestamp);
    }
    if (!nullToAbsent || raw != null) {
      map['raw'] = Variable<String>(raw);
    }
    return map;
  }

  EventLogsCompanion toCompanion(bool nullToAbsent) {
    return EventLogsCompanion(
      id: Value(id),
      event: Value(event),
      description: description == null && nullToAbsent
          ? const Value.absent()
          : Value(description),
      sampleId: sampleId == null && nullToAbsent
          ? const Value.absent()
          : Value(sampleId),
      dispatchId: dispatchId == null && nullToAbsent
          ? const Value.absent()
          : Value(dispatchId),
      timestamp: timestamp == null && nullToAbsent
          ? const Value.absent()
          : Value(timestamp),
      raw: raw == null && nullToAbsent ? const Value.absent() : Value(raw),
    );
  }

  factory EventLog.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return EventLog(
      id: serializer.fromJson<String>(json['id']),
      event: serializer.fromJson<String>(json['event']),
      description: serializer.fromJson<String?>(json['description']),
      sampleId: serializer.fromJson<String?>(json['sampleId']),
      dispatchId: serializer.fromJson<String?>(json['dispatchId']),
      timestamp: serializer.fromJson<DateTime?>(json['timestamp']),
      raw: serializer.fromJson<String?>(json['raw']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'event': serializer.toJson<String>(event),
      'description': serializer.toJson<String?>(description),
      'sampleId': serializer.toJson<String?>(sampleId),
      'dispatchId': serializer.toJson<String?>(dispatchId),
      'timestamp': serializer.toJson<DateTime?>(timestamp),
      'raw': serializer.toJson<String?>(raw),
    };
  }

  EventLog copyWith(
          {String? id,
          String? event,
          Value<String?> description = const Value.absent(),
          Value<String?> sampleId = const Value.absent(),
          Value<String?> dispatchId = const Value.absent(),
          Value<DateTime?> timestamp = const Value.absent(),
          Value<String?> raw = const Value.absent()}) =>
      EventLog(
        id: id ?? this.id,
        event: event ?? this.event,
        description: description.present ? description.value : this.description,
        sampleId: sampleId.present ? sampleId.value : this.sampleId,
        dispatchId: dispatchId.present ? dispatchId.value : this.dispatchId,
        timestamp: timestamp.present ? timestamp.value : this.timestamp,
        raw: raw.present ? raw.value : this.raw,
      );
  EventLog copyWithCompanion(EventLogsCompanion data) {
    return EventLog(
      id: data.id.present ? data.id.value : this.id,
      event: data.event.present ? data.event.value : this.event,
      description:
          data.description.present ? data.description.value : this.description,
      sampleId: data.sampleId.present ? data.sampleId.value : this.sampleId,
      dispatchId:
          data.dispatchId.present ? data.dispatchId.value : this.dispatchId,
      timestamp: data.timestamp.present ? data.timestamp.value : this.timestamp,
      raw: data.raw.present ? data.raw.value : this.raw,
    );
  }

  @override
  String toString() {
    return (StringBuffer('EventLog(')
          ..write('id: $id, ')
          ..write('event: $event, ')
          ..write('description: $description, ')
          ..write('sampleId: $sampleId, ')
          ..write('dispatchId: $dispatchId, ')
          ..write('timestamp: $timestamp, ')
          ..write('raw: $raw')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, event, description, sampleId, dispatchId, timestamp, raw);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is EventLog &&
          other.id == this.id &&
          other.event == this.event &&
          other.description == this.description &&
          other.sampleId == this.sampleId &&
          other.dispatchId == this.dispatchId &&
          other.timestamp == this.timestamp &&
          other.raw == this.raw);
}

class EventLogsCompanion extends UpdateCompanion<EventLog> {
  final Value<String> id;
  final Value<String> event;
  final Value<String?> description;
  final Value<String?> sampleId;
  final Value<String?> dispatchId;
  final Value<DateTime?> timestamp;
  final Value<String?> raw;
  final Value<int> rowid;
  const EventLogsCompanion({
    this.id = const Value.absent(),
    this.event = const Value.absent(),
    this.description = const Value.absent(),
    this.sampleId = const Value.absent(),
    this.dispatchId = const Value.absent(),
    this.timestamp = const Value.absent(),
    this.raw = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  EventLogsCompanion.insert({
    required String id,
    required String event,
    this.description = const Value.absent(),
    this.sampleId = const Value.absent(),
    this.dispatchId = const Value.absent(),
    this.timestamp = const Value.absent(),
    this.raw = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        event = Value(event);
  static Insertable<EventLog> custom({
    Expression<String>? id,
    Expression<String>? event,
    Expression<String>? description,
    Expression<String>? sampleId,
    Expression<String>? dispatchId,
    Expression<DateTime>? timestamp,
    Expression<String>? raw,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (event != null) 'event': event,
      if (description != null) 'description': description,
      if (sampleId != null) 'sample_id': sampleId,
      if (dispatchId != null) 'dispatch_id': dispatchId,
      if (timestamp != null) 'timestamp': timestamp,
      if (raw != null) 'raw': raw,
      if (rowid != null) 'rowid': rowid,
    });
  }

  EventLogsCompanion copyWith(
      {Value<String>? id,
      Value<String>? event,
      Value<String?>? description,
      Value<String?>? sampleId,
      Value<String?>? dispatchId,
      Value<DateTime?>? timestamp,
      Value<String?>? raw,
      Value<int>? rowid}) {
    return EventLogsCompanion(
      id: id ?? this.id,
      event: event ?? this.event,
      description: description ?? this.description,
      sampleId: sampleId ?? this.sampleId,
      dispatchId: dispatchId ?? this.dispatchId,
      timestamp: timestamp ?? this.timestamp,
      raw: raw ?? this.raw,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (event.present) {
      map['event'] = Variable<String>(event.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (sampleId.present) {
      map['sample_id'] = Variable<String>(sampleId.value);
    }
    if (dispatchId.present) {
      map['dispatch_id'] = Variable<String>(dispatchId.value);
    }
    if (timestamp.present) {
      map['timestamp'] = Variable<DateTime>(timestamp.value);
    }
    if (raw.present) {
      map['raw'] = Variable<String>(raw.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('EventLogsCompanion(')
          ..write('id: $id, ')
          ..write('event: $event, ')
          ..write('description: $description, ')
          ..write('sampleId: $sampleId, ')
          ..write('dispatchId: $dispatchId, ')
          ..write('timestamp: $timestamp, ')
          ..write('raw: $raw, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $OutboxTable extends Outbox with TableInfo<$OutboxTable, OutboxData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $OutboxTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _methodMeta = const VerificationMeta('method');
  @override
  late final GeneratedColumn<String> method = GeneratedColumn<String>(
      'method', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _pathMeta = const VerificationMeta('path');
  @override
  late final GeneratedColumn<String> path = GeneratedColumn<String>(
      'path', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _bodyMeta = const VerificationMeta('body');
  @override
  late final GeneratedColumn<String> body = GeneratedColumn<String>(
      'body', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _entityTypeMeta =
      const VerificationMeta('entityType');
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
      'entity_type', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _entityIdMeta =
      const VerificationMeta('entityId');
  @override
  late final GeneratedColumn<String> entityId = GeneratedColumn<String>(
      'entity_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _attemptsMeta =
      const VerificationMeta('attempts');
  @override
  late final GeneratedColumn<int> attempts = GeneratedColumn<int>(
      'attempts', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _lastErrorMeta =
      const VerificationMeta('lastError');
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
      'last_error', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        method,
        path,
        body,
        entityType,
        entityId,
        attempts,
        lastError,
        createdAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'outbox';
  @override
  VerificationContext validateIntegrity(Insertable<OutboxData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('method')) {
      context.handle(_methodMeta,
          method.isAcceptableOrUnknown(data['method']!, _methodMeta));
    } else if (isInserting) {
      context.missing(_methodMeta);
    }
    if (data.containsKey('path')) {
      context.handle(
          _pathMeta, path.isAcceptableOrUnknown(data['path']!, _pathMeta));
    } else if (isInserting) {
      context.missing(_pathMeta);
    }
    if (data.containsKey('body')) {
      context.handle(
          _bodyMeta, body.isAcceptableOrUnknown(data['body']!, _bodyMeta));
    }
    if (data.containsKey('entity_type')) {
      context.handle(
          _entityTypeMeta,
          entityType.isAcceptableOrUnknown(
              data['entity_type']!, _entityTypeMeta));
    }
    if (data.containsKey('entity_id')) {
      context.handle(_entityIdMeta,
          entityId.isAcceptableOrUnknown(data['entity_id']!, _entityIdMeta));
    }
    if (data.containsKey('attempts')) {
      context.handle(_attemptsMeta,
          attempts.isAcceptableOrUnknown(data['attempts']!, _attemptsMeta));
    }
    if (data.containsKey('last_error')) {
      context.handle(_lastErrorMeta,
          lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  OutboxData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return OutboxData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      method: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}method'])!,
      path: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}path'])!,
      body: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}body']),
      entityType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_type']),
      entityId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_id']),
      attempts: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}attempts'])!,
      lastError: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}last_error']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $OutboxTable createAlias(String alias) {
    return $OutboxTable(attachedDatabase, alias);
  }
}

class OutboxData extends DataClass implements Insertable<OutboxData> {
  final int id;
  final String method;
  final String path;
  final String? body;
  final String? entityType;
  final String? entityId;
  final int attempts;
  final String? lastError;
  final DateTime createdAt;
  const OutboxData(
      {required this.id,
      required this.method,
      required this.path,
      this.body,
      this.entityType,
      this.entityId,
      required this.attempts,
      this.lastError,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['method'] = Variable<String>(method);
    map['path'] = Variable<String>(path);
    if (!nullToAbsent || body != null) {
      map['body'] = Variable<String>(body);
    }
    if (!nullToAbsent || entityType != null) {
      map['entity_type'] = Variable<String>(entityType);
    }
    if (!nullToAbsent || entityId != null) {
      map['entity_id'] = Variable<String>(entityId);
    }
    map['attempts'] = Variable<int>(attempts);
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  OutboxCompanion toCompanion(bool nullToAbsent) {
    return OutboxCompanion(
      id: Value(id),
      method: Value(method),
      path: Value(path),
      body: body == null && nullToAbsent ? const Value.absent() : Value(body),
      entityType: entityType == null && nullToAbsent
          ? const Value.absent()
          : Value(entityType),
      entityId: entityId == null && nullToAbsent
          ? const Value.absent()
          : Value(entityId),
      attempts: Value(attempts),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
      createdAt: Value(createdAt),
    );
  }

  factory OutboxData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return OutboxData(
      id: serializer.fromJson<int>(json['id']),
      method: serializer.fromJson<String>(json['method']),
      path: serializer.fromJson<String>(json['path']),
      body: serializer.fromJson<String?>(json['body']),
      entityType: serializer.fromJson<String?>(json['entityType']),
      entityId: serializer.fromJson<String?>(json['entityId']),
      attempts: serializer.fromJson<int>(json['attempts']),
      lastError: serializer.fromJson<String?>(json['lastError']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'method': serializer.toJson<String>(method),
      'path': serializer.toJson<String>(path),
      'body': serializer.toJson<String?>(body),
      'entityType': serializer.toJson<String?>(entityType),
      'entityId': serializer.toJson<String?>(entityId),
      'attempts': serializer.toJson<int>(attempts),
      'lastError': serializer.toJson<String?>(lastError),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  OutboxData copyWith(
          {int? id,
          String? method,
          String? path,
          Value<String?> body = const Value.absent(),
          Value<String?> entityType = const Value.absent(),
          Value<String?> entityId = const Value.absent(),
          int? attempts,
          Value<String?> lastError = const Value.absent(),
          DateTime? createdAt}) =>
      OutboxData(
        id: id ?? this.id,
        method: method ?? this.method,
        path: path ?? this.path,
        body: body.present ? body.value : this.body,
        entityType: entityType.present ? entityType.value : this.entityType,
        entityId: entityId.present ? entityId.value : this.entityId,
        attempts: attempts ?? this.attempts,
        lastError: lastError.present ? lastError.value : this.lastError,
        createdAt: createdAt ?? this.createdAt,
      );
  OutboxData copyWithCompanion(OutboxCompanion data) {
    return OutboxData(
      id: data.id.present ? data.id.value : this.id,
      method: data.method.present ? data.method.value : this.method,
      path: data.path.present ? data.path.value : this.path,
      body: data.body.present ? data.body.value : this.body,
      entityType:
          data.entityType.present ? data.entityType.value : this.entityType,
      entityId: data.entityId.present ? data.entityId.value : this.entityId,
      attempts: data.attempts.present ? data.attempts.value : this.attempts,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('OutboxData(')
          ..write('id: $id, ')
          ..write('method: $method, ')
          ..write('path: $path, ')
          ..write('body: $body, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('attempts: $attempts, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, method, path, body, entityType, entityId,
      attempts, lastError, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is OutboxData &&
          other.id == this.id &&
          other.method == this.method &&
          other.path == this.path &&
          other.body == this.body &&
          other.entityType == this.entityType &&
          other.entityId == this.entityId &&
          other.attempts == this.attempts &&
          other.lastError == this.lastError &&
          other.createdAt == this.createdAt);
}

class OutboxCompanion extends UpdateCompanion<OutboxData> {
  final Value<int> id;
  final Value<String> method;
  final Value<String> path;
  final Value<String?> body;
  final Value<String?> entityType;
  final Value<String?> entityId;
  final Value<int> attempts;
  final Value<String?> lastError;
  final Value<DateTime> createdAt;
  const OutboxCompanion({
    this.id = const Value.absent(),
    this.method = const Value.absent(),
    this.path = const Value.absent(),
    this.body = const Value.absent(),
    this.entityType = const Value.absent(),
    this.entityId = const Value.absent(),
    this.attempts = const Value.absent(),
    this.lastError = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  OutboxCompanion.insert({
    this.id = const Value.absent(),
    required String method,
    required String path,
    this.body = const Value.absent(),
    this.entityType = const Value.absent(),
    this.entityId = const Value.absent(),
    this.attempts = const Value.absent(),
    this.lastError = const Value.absent(),
    required DateTime createdAt,
  })  : method = Value(method),
        path = Value(path),
        createdAt = Value(createdAt);
  static Insertable<OutboxData> custom({
    Expression<int>? id,
    Expression<String>? method,
    Expression<String>? path,
    Expression<String>? body,
    Expression<String>? entityType,
    Expression<String>? entityId,
    Expression<int>? attempts,
    Expression<String>? lastError,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (method != null) 'method': method,
      if (path != null) 'path': path,
      if (body != null) 'body': body,
      if (entityType != null) 'entity_type': entityType,
      if (entityId != null) 'entity_id': entityId,
      if (attempts != null) 'attempts': attempts,
      if (lastError != null) 'last_error': lastError,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  OutboxCompanion copyWith(
      {Value<int>? id,
      Value<String>? method,
      Value<String>? path,
      Value<String?>? body,
      Value<String?>? entityType,
      Value<String?>? entityId,
      Value<int>? attempts,
      Value<String?>? lastError,
      Value<DateTime>? createdAt}) {
    return OutboxCompanion(
      id: id ?? this.id,
      method: method ?? this.method,
      path: path ?? this.path,
      body: body ?? this.body,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      attempts: attempts ?? this.attempts,
      lastError: lastError ?? this.lastError,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (method.present) {
      map['method'] = Variable<String>(method.value);
    }
    if (path.present) {
      map['path'] = Variable<String>(path.value);
    }
    if (body.present) {
      map['body'] = Variable<String>(body.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (entityId.present) {
      map['entity_id'] = Variable<String>(entityId.value);
    }
    if (attempts.present) {
      map['attempts'] = Variable<int>(attempts.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('OutboxCompanion(')
          ..write('id: $id, ')
          ..write('method: $method, ')
          ..write('path: $path, ')
          ..write('body: $body, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('attempts: $attempts, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

abstract class _$LocalDb extends GeneratedDatabase {
  _$LocalDb(QueryExecutor e) : super(e);
  $LocalDbManager get managers => $LocalDbManager(this);
  late final $UsersTable users = $UsersTable(this);
  late final $FacilitiesTable facilities = $FacilitiesTable(this);
  late final $SamplesTable samples = $SamplesTable(this);
  late final $DispatchesTable dispatches = $DispatchesTable(this);
  late final $EventLogsTable eventLogs = $EventLogsTable(this);
  late final $OutboxTable outbox = $OutboxTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities =>
      [users, facilities, samples, dispatches, eventLogs, outbox];
}

typedef $$UsersTableCreateCompanionBuilder = UsersCompanion Function({
  required String id,
  required String email,
  Value<String?> phone,
  required String firstName,
  required String lastName,
  required String role,
  Value<String?> facilityId,
  Value<String?> passwordHash,
  Value<String?> pinHash,
  Value<bool> isActive,
  Value<String?> raw,
  Value<DateTime?> updatedAt,
  Value<int> rowid,
});
typedef $$UsersTableUpdateCompanionBuilder = UsersCompanion Function({
  Value<String> id,
  Value<String> email,
  Value<String?> phone,
  Value<String> firstName,
  Value<String> lastName,
  Value<String> role,
  Value<String?> facilityId,
  Value<String?> passwordHash,
  Value<String?> pinHash,
  Value<bool> isActive,
  Value<String?> raw,
  Value<DateTime?> updatedAt,
  Value<int> rowid,
});

class $$UsersTableFilterComposer extends Composer<_$LocalDb, $UsersTable> {
  $$UsersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get phone => $composableBuilder(
      column: $table.phone, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get firstName => $composableBuilder(
      column: $table.firstName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastName => $composableBuilder(
      column: $table.lastName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get role => $composableBuilder(
      column: $table.role, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get facilityId => $composableBuilder(
      column: $table.facilityId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get passwordHash => $composableBuilder(
      column: $table.passwordHash, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get pinHash => $composableBuilder(
      column: $table.pinHash, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isActive => $composableBuilder(
      column: $table.isActive, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get raw => $composableBuilder(
      column: $table.raw, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$UsersTableOrderingComposer extends Composer<_$LocalDb, $UsersTable> {
  $$UsersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get phone => $composableBuilder(
      column: $table.phone, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get firstName => $composableBuilder(
      column: $table.firstName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastName => $composableBuilder(
      column: $table.lastName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get role => $composableBuilder(
      column: $table.role, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get facilityId => $composableBuilder(
      column: $table.facilityId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get passwordHash => $composableBuilder(
      column: $table.passwordHash,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get pinHash => $composableBuilder(
      column: $table.pinHash, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isActive => $composableBuilder(
      column: $table.isActive, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get raw => $composableBuilder(
      column: $table.raw, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$UsersTableAnnotationComposer extends Composer<_$LocalDb, $UsersTable> {
  $$UsersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<String> get firstName =>
      $composableBuilder(column: $table.firstName, builder: (column) => column);

  GeneratedColumn<String> get lastName =>
      $composableBuilder(column: $table.lastName, builder: (column) => column);

  GeneratedColumn<String> get role =>
      $composableBuilder(column: $table.role, builder: (column) => column);

  GeneratedColumn<String> get facilityId => $composableBuilder(
      column: $table.facilityId, builder: (column) => column);

  GeneratedColumn<String> get passwordHash => $composableBuilder(
      column: $table.passwordHash, builder: (column) => column);

  GeneratedColumn<String> get pinHash =>
      $composableBuilder(column: $table.pinHash, builder: (column) => column);

  GeneratedColumn<bool> get isActive =>
      $composableBuilder(column: $table.isActive, builder: (column) => column);

  GeneratedColumn<String> get raw =>
      $composableBuilder(column: $table.raw, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$UsersTableTableManager extends RootTableManager<
    _$LocalDb,
    $UsersTable,
    User,
    $$UsersTableFilterComposer,
    $$UsersTableOrderingComposer,
    $$UsersTableAnnotationComposer,
    $$UsersTableCreateCompanionBuilder,
    $$UsersTableUpdateCompanionBuilder,
    (User, BaseReferences<_$LocalDb, $UsersTable, User>),
    User,
    PrefetchHooks Function()> {
  $$UsersTableTableManager(_$LocalDb db, $UsersTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$UsersTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$UsersTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$UsersTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> email = const Value.absent(),
            Value<String?> phone = const Value.absent(),
            Value<String> firstName = const Value.absent(),
            Value<String> lastName = const Value.absent(),
            Value<String> role = const Value.absent(),
            Value<String?> facilityId = const Value.absent(),
            Value<String?> passwordHash = const Value.absent(),
            Value<String?> pinHash = const Value.absent(),
            Value<bool> isActive = const Value.absent(),
            Value<String?> raw = const Value.absent(),
            Value<DateTime?> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              UsersCompanion(
            id: id,
            email: email,
            phone: phone,
            firstName: firstName,
            lastName: lastName,
            role: role,
            facilityId: facilityId,
            passwordHash: passwordHash,
            pinHash: pinHash,
            isActive: isActive,
            raw: raw,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String email,
            Value<String?> phone = const Value.absent(),
            required String firstName,
            required String lastName,
            required String role,
            Value<String?> facilityId = const Value.absent(),
            Value<String?> passwordHash = const Value.absent(),
            Value<String?> pinHash = const Value.absent(),
            Value<bool> isActive = const Value.absent(),
            Value<String?> raw = const Value.absent(),
            Value<DateTime?> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              UsersCompanion.insert(
            id: id,
            email: email,
            phone: phone,
            firstName: firstName,
            lastName: lastName,
            role: role,
            facilityId: facilityId,
            passwordHash: passwordHash,
            pinHash: pinHash,
            isActive: isActive,
            raw: raw,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$UsersTableProcessedTableManager = ProcessedTableManager<
    _$LocalDb,
    $UsersTable,
    User,
    $$UsersTableFilterComposer,
    $$UsersTableOrderingComposer,
    $$UsersTableAnnotationComposer,
    $$UsersTableCreateCompanionBuilder,
    $$UsersTableUpdateCompanionBuilder,
    (User, BaseReferences<_$LocalDb, $UsersTable, User>),
    User,
    PrefetchHooks Function()>;
typedef $$FacilitiesTableCreateCompanionBuilder = FacilitiesCompanion Function({
  required String id,
  Value<String?> code,
  required String name,
  Value<String?> type,
  Value<String?> district,
  Value<String?> raw,
  Value<int> rowid,
});
typedef $$FacilitiesTableUpdateCompanionBuilder = FacilitiesCompanion Function({
  Value<String> id,
  Value<String?> code,
  Value<String> name,
  Value<String?> type,
  Value<String?> district,
  Value<String?> raw,
  Value<int> rowid,
});

class $$FacilitiesTableFilterComposer
    extends Composer<_$LocalDb, $FacilitiesTable> {
  $$FacilitiesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get code => $composableBuilder(
      column: $table.code, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get type => $composableBuilder(
      column: $table.type, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get district => $composableBuilder(
      column: $table.district, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get raw => $composableBuilder(
      column: $table.raw, builder: (column) => ColumnFilters(column));
}

class $$FacilitiesTableOrderingComposer
    extends Composer<_$LocalDb, $FacilitiesTable> {
  $$FacilitiesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get code => $composableBuilder(
      column: $table.code, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get type => $composableBuilder(
      column: $table.type, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get district => $composableBuilder(
      column: $table.district, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get raw => $composableBuilder(
      column: $table.raw, builder: (column) => ColumnOrderings(column));
}

class $$FacilitiesTableAnnotationComposer
    extends Composer<_$LocalDb, $FacilitiesTable> {
  $$FacilitiesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get code =>
      $composableBuilder(column: $table.code, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  GeneratedColumn<String> get district =>
      $composableBuilder(column: $table.district, builder: (column) => column);

  GeneratedColumn<String> get raw =>
      $composableBuilder(column: $table.raw, builder: (column) => column);
}

class $$FacilitiesTableTableManager extends RootTableManager<
    _$LocalDb,
    $FacilitiesTable,
    Facility,
    $$FacilitiesTableFilterComposer,
    $$FacilitiesTableOrderingComposer,
    $$FacilitiesTableAnnotationComposer,
    $$FacilitiesTableCreateCompanionBuilder,
    $$FacilitiesTableUpdateCompanionBuilder,
    (Facility, BaseReferences<_$LocalDb, $FacilitiesTable, Facility>),
    Facility,
    PrefetchHooks Function()> {
  $$FacilitiesTableTableManager(_$LocalDb db, $FacilitiesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FacilitiesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FacilitiesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FacilitiesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String?> code = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String?> type = const Value.absent(),
            Value<String?> district = const Value.absent(),
            Value<String?> raw = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              FacilitiesCompanion(
            id: id,
            code: code,
            name: name,
            type: type,
            district: district,
            raw: raw,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            Value<String?> code = const Value.absent(),
            required String name,
            Value<String?> type = const Value.absent(),
            Value<String?> district = const Value.absent(),
            Value<String?> raw = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              FacilitiesCompanion.insert(
            id: id,
            code: code,
            name: name,
            type: type,
            district: district,
            raw: raw,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$FacilitiesTableProcessedTableManager = ProcessedTableManager<
    _$LocalDb,
    $FacilitiesTable,
    Facility,
    $$FacilitiesTableFilterComposer,
    $$FacilitiesTableOrderingComposer,
    $$FacilitiesTableAnnotationComposer,
    $$FacilitiesTableCreateCompanionBuilder,
    $$FacilitiesTableUpdateCompanionBuilder,
    (Facility, BaseReferences<_$LocalDb, $FacilitiesTable, Facility>),
    Facility,
    PrefetchHooks Function()>;
typedef $$SamplesTableCreateCompanionBuilder = SamplesCompanion Function({
  required String id,
  required String sampleId,
  required String sampleType,
  required String status,
  required String diseaseProgram,
  Value<int> quantity,
  Value<String?> village,
  Value<int?> patientAge,
  Value<String?> patientGender,
  Value<String?> notes,
  Value<String?> qrCode,
  Value<String?> facilityId,
  Value<String?> collectedById,
  Value<String?> dispatcherId,
  Value<String?> dispatchId,
  Value<DateTime?> collectedAt,
  Value<DateTime?> completedAt,
  Value<DateTime?> createdAt,
  Value<String?> raw,
  Value<bool> dirty,
  Value<bool> deleted,
  Value<int> rowid,
});
typedef $$SamplesTableUpdateCompanionBuilder = SamplesCompanion Function({
  Value<String> id,
  Value<String> sampleId,
  Value<String> sampleType,
  Value<String> status,
  Value<String> diseaseProgram,
  Value<int> quantity,
  Value<String?> village,
  Value<int?> patientAge,
  Value<String?> patientGender,
  Value<String?> notes,
  Value<String?> qrCode,
  Value<String?> facilityId,
  Value<String?> collectedById,
  Value<String?> dispatcherId,
  Value<String?> dispatchId,
  Value<DateTime?> collectedAt,
  Value<DateTime?> completedAt,
  Value<DateTime?> createdAt,
  Value<String?> raw,
  Value<bool> dirty,
  Value<bool> deleted,
  Value<int> rowid,
});

class $$SamplesTableFilterComposer extends Composer<_$LocalDb, $SamplesTable> {
  $$SamplesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get sampleId => $composableBuilder(
      column: $table.sampleId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get sampleType => $composableBuilder(
      column: $table.sampleType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get diseaseProgram => $composableBuilder(
      column: $table.diseaseProgram,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get quantity => $composableBuilder(
      column: $table.quantity, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get village => $composableBuilder(
      column: $table.village, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get patientAge => $composableBuilder(
      column: $table.patientAge, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get patientGender => $composableBuilder(
      column: $table.patientGender, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get qrCode => $composableBuilder(
      column: $table.qrCode, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get facilityId => $composableBuilder(
      column: $table.facilityId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get collectedById => $composableBuilder(
      column: $table.collectedById, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get dispatcherId => $composableBuilder(
      column: $table.dispatcherId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get dispatchId => $composableBuilder(
      column: $table.dispatchId, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get collectedAt => $composableBuilder(
      column: $table.collectedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get completedAt => $composableBuilder(
      column: $table.completedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get raw => $composableBuilder(
      column: $table.raw, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get dirty => $composableBuilder(
      column: $table.dirty, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get deleted => $composableBuilder(
      column: $table.deleted, builder: (column) => ColumnFilters(column));
}

class $$SamplesTableOrderingComposer
    extends Composer<_$LocalDb, $SamplesTable> {
  $$SamplesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get sampleId => $composableBuilder(
      column: $table.sampleId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get sampleType => $composableBuilder(
      column: $table.sampleType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get diseaseProgram => $composableBuilder(
      column: $table.diseaseProgram,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get quantity => $composableBuilder(
      column: $table.quantity, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get village => $composableBuilder(
      column: $table.village, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get patientAge => $composableBuilder(
      column: $table.patientAge, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get patientGender => $composableBuilder(
      column: $table.patientGender,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get qrCode => $composableBuilder(
      column: $table.qrCode, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get facilityId => $composableBuilder(
      column: $table.facilityId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get collectedById => $composableBuilder(
      column: $table.collectedById,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get dispatcherId => $composableBuilder(
      column: $table.dispatcherId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get dispatchId => $composableBuilder(
      column: $table.dispatchId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get collectedAt => $composableBuilder(
      column: $table.collectedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get completedAt => $composableBuilder(
      column: $table.completedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get raw => $composableBuilder(
      column: $table.raw, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get dirty => $composableBuilder(
      column: $table.dirty, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get deleted => $composableBuilder(
      column: $table.deleted, builder: (column) => ColumnOrderings(column));
}

class $$SamplesTableAnnotationComposer
    extends Composer<_$LocalDb, $SamplesTable> {
  $$SamplesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get sampleId =>
      $composableBuilder(column: $table.sampleId, builder: (column) => column);

  GeneratedColumn<String> get sampleType => $composableBuilder(
      column: $table.sampleType, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get diseaseProgram => $composableBuilder(
      column: $table.diseaseProgram, builder: (column) => column);

  GeneratedColumn<int> get quantity =>
      $composableBuilder(column: $table.quantity, builder: (column) => column);

  GeneratedColumn<String> get village =>
      $composableBuilder(column: $table.village, builder: (column) => column);

  GeneratedColumn<int> get patientAge => $composableBuilder(
      column: $table.patientAge, builder: (column) => column);

  GeneratedColumn<String> get patientGender => $composableBuilder(
      column: $table.patientGender, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<String> get qrCode =>
      $composableBuilder(column: $table.qrCode, builder: (column) => column);

  GeneratedColumn<String> get facilityId => $composableBuilder(
      column: $table.facilityId, builder: (column) => column);

  GeneratedColumn<String> get collectedById => $composableBuilder(
      column: $table.collectedById, builder: (column) => column);

  GeneratedColumn<String> get dispatcherId => $composableBuilder(
      column: $table.dispatcherId, builder: (column) => column);

  GeneratedColumn<String> get dispatchId => $composableBuilder(
      column: $table.dispatchId, builder: (column) => column);

  GeneratedColumn<DateTime> get collectedAt => $composableBuilder(
      column: $table.collectedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get completedAt => $composableBuilder(
      column: $table.completedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<String> get raw =>
      $composableBuilder(column: $table.raw, builder: (column) => column);

  GeneratedColumn<bool> get dirty =>
      $composableBuilder(column: $table.dirty, builder: (column) => column);

  GeneratedColumn<bool> get deleted =>
      $composableBuilder(column: $table.deleted, builder: (column) => column);
}

class $$SamplesTableTableManager extends RootTableManager<
    _$LocalDb,
    $SamplesTable,
    Sample,
    $$SamplesTableFilterComposer,
    $$SamplesTableOrderingComposer,
    $$SamplesTableAnnotationComposer,
    $$SamplesTableCreateCompanionBuilder,
    $$SamplesTableUpdateCompanionBuilder,
    (Sample, BaseReferences<_$LocalDb, $SamplesTable, Sample>),
    Sample,
    PrefetchHooks Function()> {
  $$SamplesTableTableManager(_$LocalDb db, $SamplesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SamplesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SamplesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SamplesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> sampleId = const Value.absent(),
            Value<String> sampleType = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<String> diseaseProgram = const Value.absent(),
            Value<int> quantity = const Value.absent(),
            Value<String?> village = const Value.absent(),
            Value<int?> patientAge = const Value.absent(),
            Value<String?> patientGender = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            Value<String?> qrCode = const Value.absent(),
            Value<String?> facilityId = const Value.absent(),
            Value<String?> collectedById = const Value.absent(),
            Value<String?> dispatcherId = const Value.absent(),
            Value<String?> dispatchId = const Value.absent(),
            Value<DateTime?> collectedAt = const Value.absent(),
            Value<DateTime?> completedAt = const Value.absent(),
            Value<DateTime?> createdAt = const Value.absent(),
            Value<String?> raw = const Value.absent(),
            Value<bool> dirty = const Value.absent(),
            Value<bool> deleted = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SamplesCompanion(
            id: id,
            sampleId: sampleId,
            sampleType: sampleType,
            status: status,
            diseaseProgram: diseaseProgram,
            quantity: quantity,
            village: village,
            patientAge: patientAge,
            patientGender: patientGender,
            notes: notes,
            qrCode: qrCode,
            facilityId: facilityId,
            collectedById: collectedById,
            dispatcherId: dispatcherId,
            dispatchId: dispatchId,
            collectedAt: collectedAt,
            completedAt: completedAt,
            createdAt: createdAt,
            raw: raw,
            dirty: dirty,
            deleted: deleted,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String sampleId,
            required String sampleType,
            required String status,
            required String diseaseProgram,
            Value<int> quantity = const Value.absent(),
            Value<String?> village = const Value.absent(),
            Value<int?> patientAge = const Value.absent(),
            Value<String?> patientGender = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            Value<String?> qrCode = const Value.absent(),
            Value<String?> facilityId = const Value.absent(),
            Value<String?> collectedById = const Value.absent(),
            Value<String?> dispatcherId = const Value.absent(),
            Value<String?> dispatchId = const Value.absent(),
            Value<DateTime?> collectedAt = const Value.absent(),
            Value<DateTime?> completedAt = const Value.absent(),
            Value<DateTime?> createdAt = const Value.absent(),
            Value<String?> raw = const Value.absent(),
            Value<bool> dirty = const Value.absent(),
            Value<bool> deleted = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SamplesCompanion.insert(
            id: id,
            sampleId: sampleId,
            sampleType: sampleType,
            status: status,
            diseaseProgram: diseaseProgram,
            quantity: quantity,
            village: village,
            patientAge: patientAge,
            patientGender: patientGender,
            notes: notes,
            qrCode: qrCode,
            facilityId: facilityId,
            collectedById: collectedById,
            dispatcherId: dispatcherId,
            dispatchId: dispatchId,
            collectedAt: collectedAt,
            completedAt: completedAt,
            createdAt: createdAt,
            raw: raw,
            dirty: dirty,
            deleted: deleted,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SamplesTableProcessedTableManager = ProcessedTableManager<
    _$LocalDb,
    $SamplesTable,
    Sample,
    $$SamplesTableFilterComposer,
    $$SamplesTableOrderingComposer,
    $$SamplesTableAnnotationComposer,
    $$SamplesTableCreateCompanionBuilder,
    $$SamplesTableUpdateCompanionBuilder,
    (Sample, BaseReferences<_$LocalDb, $SamplesTable, Sample>),
    Sample,
    PrefetchHooks Function()>;
typedef $$DispatchesTableCreateCompanionBuilder = DispatchesCompanion Function({
  required String id,
  required String dispatchId,
  required String status,
  Value<int> sampleCount,
  Value<String?> coolerId,
  Value<String?> riderId,
  Value<String?> originFacilityId,
  Value<String?> destinationFacilityId,
  Value<DateTime?> createdAt,
  Value<String?> raw,
  Value<bool> dirty,
  Value<bool> deleted,
  Value<int> rowid,
});
typedef $$DispatchesTableUpdateCompanionBuilder = DispatchesCompanion Function({
  Value<String> id,
  Value<String> dispatchId,
  Value<String> status,
  Value<int> sampleCount,
  Value<String?> coolerId,
  Value<String?> riderId,
  Value<String?> originFacilityId,
  Value<String?> destinationFacilityId,
  Value<DateTime?> createdAt,
  Value<String?> raw,
  Value<bool> dirty,
  Value<bool> deleted,
  Value<int> rowid,
});

class $$DispatchesTableFilterComposer
    extends Composer<_$LocalDb, $DispatchesTable> {
  $$DispatchesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get dispatchId => $composableBuilder(
      column: $table.dispatchId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get sampleCount => $composableBuilder(
      column: $table.sampleCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get coolerId => $composableBuilder(
      column: $table.coolerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get riderId => $composableBuilder(
      column: $table.riderId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get originFacilityId => $composableBuilder(
      column: $table.originFacilityId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get destinationFacilityId => $composableBuilder(
      column: $table.destinationFacilityId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get raw => $composableBuilder(
      column: $table.raw, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get dirty => $composableBuilder(
      column: $table.dirty, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get deleted => $composableBuilder(
      column: $table.deleted, builder: (column) => ColumnFilters(column));
}

class $$DispatchesTableOrderingComposer
    extends Composer<_$LocalDb, $DispatchesTable> {
  $$DispatchesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get dispatchId => $composableBuilder(
      column: $table.dispatchId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get sampleCount => $composableBuilder(
      column: $table.sampleCount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get coolerId => $composableBuilder(
      column: $table.coolerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get riderId => $composableBuilder(
      column: $table.riderId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get originFacilityId => $composableBuilder(
      column: $table.originFacilityId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get destinationFacilityId => $composableBuilder(
      column: $table.destinationFacilityId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get raw => $composableBuilder(
      column: $table.raw, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get dirty => $composableBuilder(
      column: $table.dirty, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get deleted => $composableBuilder(
      column: $table.deleted, builder: (column) => ColumnOrderings(column));
}

class $$DispatchesTableAnnotationComposer
    extends Composer<_$LocalDb, $DispatchesTable> {
  $$DispatchesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get dispatchId => $composableBuilder(
      column: $table.dispatchId, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get sampleCount => $composableBuilder(
      column: $table.sampleCount, builder: (column) => column);

  GeneratedColumn<String> get coolerId =>
      $composableBuilder(column: $table.coolerId, builder: (column) => column);

  GeneratedColumn<String> get riderId =>
      $composableBuilder(column: $table.riderId, builder: (column) => column);

  GeneratedColumn<String> get originFacilityId => $composableBuilder(
      column: $table.originFacilityId, builder: (column) => column);

  GeneratedColumn<String> get destinationFacilityId => $composableBuilder(
      column: $table.destinationFacilityId, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<String> get raw =>
      $composableBuilder(column: $table.raw, builder: (column) => column);

  GeneratedColumn<bool> get dirty =>
      $composableBuilder(column: $table.dirty, builder: (column) => column);

  GeneratedColumn<bool> get deleted =>
      $composableBuilder(column: $table.deleted, builder: (column) => column);
}

class $$DispatchesTableTableManager extends RootTableManager<
    _$LocalDb,
    $DispatchesTable,
    Dispatche,
    $$DispatchesTableFilterComposer,
    $$DispatchesTableOrderingComposer,
    $$DispatchesTableAnnotationComposer,
    $$DispatchesTableCreateCompanionBuilder,
    $$DispatchesTableUpdateCompanionBuilder,
    (Dispatche, BaseReferences<_$LocalDb, $DispatchesTable, Dispatche>),
    Dispatche,
    PrefetchHooks Function()> {
  $$DispatchesTableTableManager(_$LocalDb db, $DispatchesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$DispatchesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$DispatchesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$DispatchesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> dispatchId = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<int> sampleCount = const Value.absent(),
            Value<String?> coolerId = const Value.absent(),
            Value<String?> riderId = const Value.absent(),
            Value<String?> originFacilityId = const Value.absent(),
            Value<String?> destinationFacilityId = const Value.absent(),
            Value<DateTime?> createdAt = const Value.absent(),
            Value<String?> raw = const Value.absent(),
            Value<bool> dirty = const Value.absent(),
            Value<bool> deleted = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              DispatchesCompanion(
            id: id,
            dispatchId: dispatchId,
            status: status,
            sampleCount: sampleCount,
            coolerId: coolerId,
            riderId: riderId,
            originFacilityId: originFacilityId,
            destinationFacilityId: destinationFacilityId,
            createdAt: createdAt,
            raw: raw,
            dirty: dirty,
            deleted: deleted,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String dispatchId,
            required String status,
            Value<int> sampleCount = const Value.absent(),
            Value<String?> coolerId = const Value.absent(),
            Value<String?> riderId = const Value.absent(),
            Value<String?> originFacilityId = const Value.absent(),
            Value<String?> destinationFacilityId = const Value.absent(),
            Value<DateTime?> createdAt = const Value.absent(),
            Value<String?> raw = const Value.absent(),
            Value<bool> dirty = const Value.absent(),
            Value<bool> deleted = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              DispatchesCompanion.insert(
            id: id,
            dispatchId: dispatchId,
            status: status,
            sampleCount: sampleCount,
            coolerId: coolerId,
            riderId: riderId,
            originFacilityId: originFacilityId,
            destinationFacilityId: destinationFacilityId,
            createdAt: createdAt,
            raw: raw,
            dirty: dirty,
            deleted: deleted,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$DispatchesTableProcessedTableManager = ProcessedTableManager<
    _$LocalDb,
    $DispatchesTable,
    Dispatche,
    $$DispatchesTableFilterComposer,
    $$DispatchesTableOrderingComposer,
    $$DispatchesTableAnnotationComposer,
    $$DispatchesTableCreateCompanionBuilder,
    $$DispatchesTableUpdateCompanionBuilder,
    (Dispatche, BaseReferences<_$LocalDb, $DispatchesTable, Dispatche>),
    Dispatche,
    PrefetchHooks Function()>;
typedef $$EventLogsTableCreateCompanionBuilder = EventLogsCompanion Function({
  required String id,
  required String event,
  Value<String?> description,
  Value<String?> sampleId,
  Value<String?> dispatchId,
  Value<DateTime?> timestamp,
  Value<String?> raw,
  Value<int> rowid,
});
typedef $$EventLogsTableUpdateCompanionBuilder = EventLogsCompanion Function({
  Value<String> id,
  Value<String> event,
  Value<String?> description,
  Value<String?> sampleId,
  Value<String?> dispatchId,
  Value<DateTime?> timestamp,
  Value<String?> raw,
  Value<int> rowid,
});

class $$EventLogsTableFilterComposer
    extends Composer<_$LocalDb, $EventLogsTable> {
  $$EventLogsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get event => $composableBuilder(
      column: $table.event, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get sampleId => $composableBuilder(
      column: $table.sampleId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get dispatchId => $composableBuilder(
      column: $table.dispatchId, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get timestamp => $composableBuilder(
      column: $table.timestamp, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get raw => $composableBuilder(
      column: $table.raw, builder: (column) => ColumnFilters(column));
}

class $$EventLogsTableOrderingComposer
    extends Composer<_$LocalDb, $EventLogsTable> {
  $$EventLogsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get event => $composableBuilder(
      column: $table.event, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get sampleId => $composableBuilder(
      column: $table.sampleId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get dispatchId => $composableBuilder(
      column: $table.dispatchId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get timestamp => $composableBuilder(
      column: $table.timestamp, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get raw => $composableBuilder(
      column: $table.raw, builder: (column) => ColumnOrderings(column));
}

class $$EventLogsTableAnnotationComposer
    extends Composer<_$LocalDb, $EventLogsTable> {
  $$EventLogsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get event =>
      $composableBuilder(column: $table.event, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => column);

  GeneratedColumn<String> get sampleId =>
      $composableBuilder(column: $table.sampleId, builder: (column) => column);

  GeneratedColumn<String> get dispatchId => $composableBuilder(
      column: $table.dispatchId, builder: (column) => column);

  GeneratedColumn<DateTime> get timestamp =>
      $composableBuilder(column: $table.timestamp, builder: (column) => column);

  GeneratedColumn<String> get raw =>
      $composableBuilder(column: $table.raw, builder: (column) => column);
}

class $$EventLogsTableTableManager extends RootTableManager<
    _$LocalDb,
    $EventLogsTable,
    EventLog,
    $$EventLogsTableFilterComposer,
    $$EventLogsTableOrderingComposer,
    $$EventLogsTableAnnotationComposer,
    $$EventLogsTableCreateCompanionBuilder,
    $$EventLogsTableUpdateCompanionBuilder,
    (EventLog, BaseReferences<_$LocalDb, $EventLogsTable, EventLog>),
    EventLog,
    PrefetchHooks Function()> {
  $$EventLogsTableTableManager(_$LocalDb db, $EventLogsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$EventLogsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$EventLogsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$EventLogsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> event = const Value.absent(),
            Value<String?> description = const Value.absent(),
            Value<String?> sampleId = const Value.absent(),
            Value<String?> dispatchId = const Value.absent(),
            Value<DateTime?> timestamp = const Value.absent(),
            Value<String?> raw = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              EventLogsCompanion(
            id: id,
            event: event,
            description: description,
            sampleId: sampleId,
            dispatchId: dispatchId,
            timestamp: timestamp,
            raw: raw,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String event,
            Value<String?> description = const Value.absent(),
            Value<String?> sampleId = const Value.absent(),
            Value<String?> dispatchId = const Value.absent(),
            Value<DateTime?> timestamp = const Value.absent(),
            Value<String?> raw = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              EventLogsCompanion.insert(
            id: id,
            event: event,
            description: description,
            sampleId: sampleId,
            dispatchId: dispatchId,
            timestamp: timestamp,
            raw: raw,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$EventLogsTableProcessedTableManager = ProcessedTableManager<
    _$LocalDb,
    $EventLogsTable,
    EventLog,
    $$EventLogsTableFilterComposer,
    $$EventLogsTableOrderingComposer,
    $$EventLogsTableAnnotationComposer,
    $$EventLogsTableCreateCompanionBuilder,
    $$EventLogsTableUpdateCompanionBuilder,
    (EventLog, BaseReferences<_$LocalDb, $EventLogsTable, EventLog>),
    EventLog,
    PrefetchHooks Function()>;
typedef $$OutboxTableCreateCompanionBuilder = OutboxCompanion Function({
  Value<int> id,
  required String method,
  required String path,
  Value<String?> body,
  Value<String?> entityType,
  Value<String?> entityId,
  Value<int> attempts,
  Value<String?> lastError,
  required DateTime createdAt,
});
typedef $$OutboxTableUpdateCompanionBuilder = OutboxCompanion Function({
  Value<int> id,
  Value<String> method,
  Value<String> path,
  Value<String?> body,
  Value<String?> entityType,
  Value<String?> entityId,
  Value<int> attempts,
  Value<String?> lastError,
  Value<DateTime> createdAt,
});

class $$OutboxTableFilterComposer extends Composer<_$LocalDb, $OutboxTable> {
  $$OutboxTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get method => $composableBuilder(
      column: $table.method, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get path => $composableBuilder(
      column: $table.path, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get body => $composableBuilder(
      column: $table.body, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get entityId => $composableBuilder(
      column: $table.entityId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get attempts => $composableBuilder(
      column: $table.attempts, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));
}

class $$OutboxTableOrderingComposer extends Composer<_$LocalDb, $OutboxTable> {
  $$OutboxTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get method => $composableBuilder(
      column: $table.method, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get path => $composableBuilder(
      column: $table.path, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get body => $composableBuilder(
      column: $table.body, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get entityId => $composableBuilder(
      column: $table.entityId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get attempts => $composableBuilder(
      column: $table.attempts, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$OutboxTableAnnotationComposer
    extends Composer<_$LocalDb, $OutboxTable> {
  $$OutboxTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get method =>
      $composableBuilder(column: $table.method, builder: (column) => column);

  GeneratedColumn<String> get path =>
      $composableBuilder(column: $table.path, builder: (column) => column);

  GeneratedColumn<String> get body =>
      $composableBuilder(column: $table.body, builder: (column) => column);

  GeneratedColumn<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => column);

  GeneratedColumn<String> get entityId =>
      $composableBuilder(column: $table.entityId, builder: (column) => column);

  GeneratedColumn<int> get attempts =>
      $composableBuilder(column: $table.attempts, builder: (column) => column);

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$OutboxTableTableManager extends RootTableManager<
    _$LocalDb,
    $OutboxTable,
    OutboxData,
    $$OutboxTableFilterComposer,
    $$OutboxTableOrderingComposer,
    $$OutboxTableAnnotationComposer,
    $$OutboxTableCreateCompanionBuilder,
    $$OutboxTableUpdateCompanionBuilder,
    (OutboxData, BaseReferences<_$LocalDb, $OutboxTable, OutboxData>),
    OutboxData,
    PrefetchHooks Function()> {
  $$OutboxTableTableManager(_$LocalDb db, $OutboxTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$OutboxTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$OutboxTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$OutboxTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> method = const Value.absent(),
            Value<String> path = const Value.absent(),
            Value<String?> body = const Value.absent(),
            Value<String?> entityType = const Value.absent(),
            Value<String?> entityId = const Value.absent(),
            Value<int> attempts = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
          }) =>
              OutboxCompanion(
            id: id,
            method: method,
            path: path,
            body: body,
            entityType: entityType,
            entityId: entityId,
            attempts: attempts,
            lastError: lastError,
            createdAt: createdAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String method,
            required String path,
            Value<String?> body = const Value.absent(),
            Value<String?> entityType = const Value.absent(),
            Value<String?> entityId = const Value.absent(),
            Value<int> attempts = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
            required DateTime createdAt,
          }) =>
              OutboxCompanion.insert(
            id: id,
            method: method,
            path: path,
            body: body,
            entityType: entityType,
            entityId: entityId,
            attempts: attempts,
            lastError: lastError,
            createdAt: createdAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$OutboxTableProcessedTableManager = ProcessedTableManager<
    _$LocalDb,
    $OutboxTable,
    OutboxData,
    $$OutboxTableFilterComposer,
    $$OutboxTableOrderingComposer,
    $$OutboxTableAnnotationComposer,
    $$OutboxTableCreateCompanionBuilder,
    $$OutboxTableUpdateCompanionBuilder,
    (OutboxData, BaseReferences<_$LocalDb, $OutboxTable, OutboxData>),
    OutboxData,
    PrefetchHooks Function()>;

class $LocalDbManager {
  final _$LocalDb _db;
  $LocalDbManager(this._db);
  $$UsersTableTableManager get users =>
      $$UsersTableTableManager(_db, _db.users);
  $$FacilitiesTableTableManager get facilities =>
      $$FacilitiesTableTableManager(_db, _db.facilities);
  $$SamplesTableTableManager get samples =>
      $$SamplesTableTableManager(_db, _db.samples);
  $$DispatchesTableTableManager get dispatches =>
      $$DispatchesTableTableManager(_db, _db.dispatches);
  $$EventLogsTableTableManager get eventLogs =>
      $$EventLogsTableTableManager(_db, _db.eventLogs);
  $$OutboxTableTableManager get outbox =>
      $$OutboxTableTableManager(_db, _db.outbox);
}
