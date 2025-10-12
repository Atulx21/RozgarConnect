export const JOB_CATEGORIES = [
  'Farming',
  'Construction', 
  'Cleaning',
  'Delivery',
  'Cooking',
  'Other'
];

export const EQUIPMENT_TYPES = [
  'Tractor',
  'Water Pump', 
  'Thresher',
  'Harvester',
  'Plough',
  'Other'
];

export const COMMON_SKILLS = [
  'Tractor Driving',
  'Paddy Weeding',
  'Bricklaying',
  'Plumbing',
  'Electrical Work',
  'Carpentry',
  'Painting',
  'Harvesting',
  'Irrigation',
  'Pest Control',
  'Cooking',
  'Cleaning'
];

export const JOB_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const APPLICATION_STATUSES = {
  PENDING: 'pending',
  HIRED: 'hired',
  REJECTED: 'rejected'
} as const;

export const EQUIPMENT_STATUSES = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  MAINTENANCE: 'maintenance'
} as const;

export const BOOKING_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed'
} as const;

export const USER_ROLES = {
  WORKER: 'worker',
  PROVIDER: 'provider'
} as const;

export const PAY_TYPES = {
  PER_DAY: 'per_day',
  TOTAL: 'total'
} as const;

export const PRICE_TYPES = {
  PER_HOUR: 'per_hour',
  PER_DAY: 'per_day'
} as const;