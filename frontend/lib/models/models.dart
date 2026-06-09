class UserModel {
  final String id;
  final String email;
  final String? phone;
  final String firstName;
  final String lastName;
  final String role;
  final String? facilityId;
  final Map<String, dynamic>? facility;

  UserModel({
    required this.id,
    required this.email,
    this.phone,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.facilityId,
    this.facility,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      role: json['role'] ?? '',
      facilityId: json['facilityId'],
      facility: json['facility'],
    );
  }

  String get fullName => '$firstName $lastName';
  String get roleLabel {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'collector': return 'Sample Collector';
      case 'dispatcher': return 'Dispatcher';
      case 'hub_officer': return 'Hub Officer';
      case 'lab_officer': return 'Lab Officer';
      default: return role;
    }
  }
}

class SampleModel {
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
  final Map<String, dynamic>? collectedBy;
  final Map<String, dynamic>? facility;
  final Map<String, dynamic>? dispatcher;
  final String? dispatchId;
  final DateTime? collectedAt;
  final DateTime? pickedUpAt;
  final DateTime? hubReceivedAt;
  final DateTime? dispatchedAt;
  final DateTime? labReceivedAt;
  final DateTime? completedAt;
  final DateTime createdAt;

  SampleModel({
    required this.id,
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
    this.collectedBy,
    this.facility,
    this.dispatcher,
    this.dispatchId,
    this.collectedAt,
    this.pickedUpAt,
    this.hubReceivedAt,
    this.dispatchedAt,
    this.labReceivedAt,
    this.completedAt,
    required this.createdAt,
  });

  factory SampleModel.fromJson(Map<String, dynamic> json) {
    return SampleModel(
      id: json['id'] ?? '',
      sampleId: json['sampleId'] ?? '',
      sampleType: json['sampleType'] ?? '',
      status: json['status'] ?? '',
      diseaseProgram: json['diseaseProgram'] ?? '',
      quantity: json['quantity'] ?? 0,
      village: json['village'],
      patientAge: json['patientAge'],
      patientGender: json['patientGender'],
      notes: json['notes'],
      qrCode: json['qrCode'],
      collectedBy: json['collectedBy'],
      facility: json['facility'],
      dispatcher: json['dispatcher'],
      dispatchId: json['dispatchId'],
      collectedAt: json['collectedAt'] != null ? DateTime.parse(json['collectedAt']) : null,
      pickedUpAt: json['pickedUpAt'] != null ? DateTime.parse(json['pickedUpAt']) : null,
      hubReceivedAt: json['hubReceivedAt'] != null ? DateTime.parse(json['hubReceivedAt']) : null,
      dispatchedAt: json['dispatchedAt'] != null ? DateTime.parse(json['dispatchedAt']) : null,
      labReceivedAt: json['labReceivedAt'] != null ? DateTime.parse(json['labReceivedAt']) : null,
      completedAt: json['completedAt'] != null ? DateTime.parse(json['completedAt']) : null,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  String get statusLabel {
    switch (status) {
      case 'collected': return 'Collected';
      case 'picked_up': return 'Picked Up';
      case 'hub_received': return 'Hub Received';
      case 'in_transit': return 'In Transit';
      case 'lab_received': return 'Lab Received';
      case 'analysis_queue': return 'Analysis Queue';
      case 'completed': return 'Completed';
      case 'lost': return 'Lost';
      default: return status;
    }
  }

  Color get statusColor {
    switch (status) {
      case 'collected': return Colors.blue;
      case 'picked_up': return Colors.orange;
      case 'hub_received': return Colors.purple;
      case 'in_transit': return Colors.amber;
      case 'lab_received': return Colors.teal;
      case 'analysis_queue': return Colors.indigo;
      case 'completed': return Colors.green;
      case 'lost': return Colors.red;
      default: return Colors.grey;
    }
  }
}

class DispatchModel {
  final String id;
  final String dispatchId;
  final String status;
  final Map<String, dynamic>? rider;
  final Map<String, dynamic>? originFacility;
  final Map<String, dynamic>? destinationFacility;
  final int sampleCount;
  final String? coolerId;
  final DateTime? pickupTime;
  final DateTime? deliveryTime;
  final DateTime createdAt;

  DispatchModel({
    required this.id,
    required this.dispatchId,
    required this.status,
    this.rider,
    this.originFacility,
    this.destinationFacility,
    required this.sampleCount,
    this.coolerId,
    this.pickupTime,
    this.deliveryTime,
    required this.createdAt,
  });

  factory DispatchModel.fromJson(Map<String, dynamic> json) {
    return DispatchModel(
      id: json['id'] ?? '',
      dispatchId: json['dispatchId'] ?? '',
      status: json['status'] ?? '',
      rider: json['rider'],
      originFacility: json['originFacility'],
      destinationFacility: json['destinationFacility'],
      sampleCount: json['sampleCount'] ?? 0,
      coolerId: json['coolerId'],
      pickupTime: json['pickupTime'] != null ? DateTime.parse(json['pickupTime']) : null,
      deliveryTime: json['deliveryTime'] != null ? DateTime.parse(json['deliveryTime']) : null,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class EventLogModel {
  final String id;
  final String event;
  final String? description;
  final Map<String, dynamic>? actor;
  final Map<String, dynamic>? facility;
  final DateTime timestamp;

  EventLogModel({
    required this.id,
    required this.event,
    this.description,
    this.actor,
    this.facility,
    required this.timestamp,
  });

  factory EventLogModel.fromJson(Map<String, dynamic> json) {
    return EventLogModel(
      id: json['id'] ?? '',
      event: json['event'] ?? '',
      description: json['description'],
      actor: json['actor'],
      facility: json['facility'],
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class NotificationModel {
  final String id;
  final String type;
  final String title;
  final String message;
  final String? sampleId;
  final String? dispatchId;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.sampleId,
    this.dispatchId,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? '',
      type: json['type'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      sampleId: json['sampleId'],
      dispatchId: json['dispatchId'],
      isRead: json['isRead'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class DashboardModel {
  final Map<String, dynamic> operational;
  final Map<String, dynamic> management;
  final List<dynamic> collectionVolume;
  final List<dynamic> statusDistribution;
  final List<dynamic> programDistribution;
  final List<dynamic> recentActivity;

  DashboardModel({
    required this.operational,
    required this.management,
    required this.collectionVolume,
    required this.statusDistribution,
    required this.programDistribution,
    required this.recentActivity,
  });

  factory DashboardModel.fromJson(Map<String, dynamic> json) {
    return DashboardModel(
      operational: json['operational'] ?? {},
      management: json['management'] ?? {},
      collectionVolume: json['collectionVolume'] ?? [],
      statusDistribution: json['statusDistribution'] ?? [],
      programDistribution: json['programDistribution'] ?? [],
      recentActivity: json['recentActivity'] ?? [],
    );
  }
}
