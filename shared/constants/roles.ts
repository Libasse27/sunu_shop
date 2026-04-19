export const ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
