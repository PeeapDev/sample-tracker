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

// Return cargo (letters + supplies) the rider brings back from the center to a
// facility. Mirrors the sample flow but in the reverse direction.
export enum ParcelStatus {
  REGISTERED = 'registered', // logged at the center, awaiting pickup
  PICKED_UP = 'picked_up', // rider collected it from the center
  IN_TRANSIT = 'in_transit', // on the way to the destination facility
  DELIVERED = 'delivered', // confirmed received at the facility
  LOST = 'lost',
}

export enum ParcelType {
  LETTER = 'letter',
  SUPPLY = 'supply',
  DOCUMENT = 'document',
  EQUIPMENT = 'equipment',
  OTHER = 'other',
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
