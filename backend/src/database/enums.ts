export enum UserRole {
  COLLECTOR = 'collector',
  DISPATCHER = 'dispatcher',
  HUB_OFFICER = 'hub_officer',
  LAB_OFFICER = 'lab_officer',
  ADMIN = 'admin',
}

export enum SampleStatus {
  COLLECTED = 'collected',
  PICKED_UP = 'picked_up',
  HUB_RECEIVED = 'hub_received',
  IN_TRANSIT = 'in_transit',
  LAB_RECEIVED = 'lab_received',
  ANALYSIS_QUEUE = 'analysis_queue',
  COMPLETED = 'completed',
  LOST = 'lost',
}

export enum DispatchStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum NotificationChannel {
  SMS = 'sms',
  PUSH = 'push',
  EMAIL = 'email',
}

export enum NotificationType {
  SAMPLE_REGISTERED = 'sample_registered',
  SAMPLE_PICKED_UP = 'sample_picked_up',
  HUB_ARRIVAL = 'hub_arrival',
  LAB_ARRIVAL = 'lab_arrival',
  SAMPLE_DELAYED = 'sample_delayed',
  SAMPLE_LOST = 'sample_lost',
}
