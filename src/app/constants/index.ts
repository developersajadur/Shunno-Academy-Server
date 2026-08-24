export const USER_ROLES = {
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
} as const;

export type TUserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const COURSE_MODES = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  HYBRID: 'Hybrid',
} as const;

export const ENROLLMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export const PAYMENT_METHODS = {
  BKASH: 'BKASH',
  NAGAD: 'NAGAD',
  ROCKET: 'ROCKET',
  UPAY: 'UPAY',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export const INQUIRY_STATUS = {
  UNREAD: 'UNREAD',
  READ: 'READ',
  CONTACTED: 'CONTACTED',
  RESOLVED: 'RESOLVED',
} as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const DEFAULT_SORT_BY = 'createdAt';
export const DEFAULT_SORT_ORDER = 'desc';

export const CACHE_TTL = {
  SHORT: 60 * 5, // 5 minutes
  MEDIUM: 60 * 30, // 30 minutes
  LONG: 60 * 60 * 24, // 24 hours
};

export const CACHE_KEYS = {
  COURSES: 'courses:all',
  COURSE_DETAIL: (slug: string) => `courses:${slug}`,
  CATEGORIES: 'categories:all',
  MENTORS: 'mentors:all',
  REVIEWS: 'reviews:approved',
  STATS: 'stats:platform',
};

