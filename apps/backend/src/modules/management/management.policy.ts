import { ForbiddenException } from '@nestjs/common';
import { publicUser } from '../auth/auth.service';
export type Actor = ReturnType<typeof publicUser>;
export const permissions = [
  'products',
  'categories',
  'orders_accept',
  'orders_manage',
  'team',
  'reports',
  'types',
  'vendors',
  'vendors_approve',
] as const;
export const platform = (u: Actor) => ['superadmin', 'admin'].includes(u.role);
export const regional = (u: Actor) =>
  ['state_admin', 'district_admin'].includes(u.role);
export const vendorAdmin = (u: Actor) => u.role === 'vendor_admin';
export function inScope(
  u: Actor,
  row: {
    state?: string | null;
    district?: string | null;
    vendorId?: string | null;
  },
) {
  if (platform(u)) return true;
  if (u.role === 'state_admin') return !!u.state && row.state === u.state;
  if (u.role === 'district_admin' || u.role === 'agent')
    return (
      !!u.state &&
      !!u.district &&
      row.state === u.state &&
      row.district === u.district
    );
  return !!u.vendorId && row.vendorId === u.vendorId;
}
export function requireScope(u: Actor, row: Parameters<typeof inScope>[1]) {
  if (!inScope(u, row))
    throw new ForbiddenException('Outside your assigned region or vendor');
}
