import { GlobalRole, OrgRole } from '@prisma/client';

export function isPlatformAdmin(globalRole: GlobalRole) {
  return globalRole === 'PLATFORM_ADMIN';
}

export function canManageOrg(role?: OrgRole) {
  return role === 'ORG_ADMIN';
}

export function canEditEvent(role?: OrgRole) {
  return role === 'ORG_ADMIN' || role === 'EDITOR';
}

export function canViewOrg(role?: OrgRole) {
  return !!role;
}
