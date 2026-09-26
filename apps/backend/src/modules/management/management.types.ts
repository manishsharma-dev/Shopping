import { UserRole } from '../auth/auth.entities';
import { ManagementRecord } from './management.entity';
export const hierarchy: Record<string, number> = {
  superadmin: 70,
  admin: 60,
  state_admin: 50,
  district_admin: 40,
  agent: 30,
  vendor_admin: 20,
  vendor: 20,
  staff: 10,
  customer: 0,
};
export const typeRoles = [
  'superadmin',
  'admin',
  'state_admin',
  'district_admin',
  'agent',
  'vendor_admin',
  'staff',
] as const;
export const rolePermissions: Record<string, string[]> = {
  superadmin: [
    'products',
    'categories',
    'orders_accept',
    'orders_manage',
    'team',
    'reports',
    'types',
    'vendors',
    'vendors_approve',
  ],
  admin: [
    'products',
    'categories',
    'orders_accept',
    'orders_manage',
    'team',
    'reports',
    'types',
    'vendors',
    'vendors_approve',
  ],
  state_admin: [
    'products',
    'categories',
    'orders_accept',
    'orders_manage',
    'team',
    'reports',
    'types',
    'vendors',
    'vendors_approve',
  ],
  district_admin: [
    'products',
    'categories',
    'orders_accept',
    'orders_manage',
    'team',
    'reports',
    'types',
    'vendors',
    'vendors_approve',
  ],
  agent: ['vendors'],
  vendor_admin: [
    'products',
    'categories',
    'orders_accept',
    'orders_manage',
    'team',
    'reports',
    'types',
  ],
  staff: [
    'products',
    'categories',
    'orders_accept',
    'orders_manage',
    'reports',
  ],
};
export const defaultTypes = typeRoles.map((role, index) => ({
  id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  role,
  name: [
    'Super Admin',
    'Admin',
    'State Admin',
    'District Admin',
    'Agent',
    'Vendor',
    'Staff',
  ][index],
  protected: ['superadmin', 'admin'].includes(role),
  permissions: role === 'staff' ? ['products'] : rolePermissions[role],
}));
export const typeRole = (type: ManagementRecord): UserRole =>
  (type.data.role || 'staff') as UserRole;
export const rank = (role: string) => hierarchy[role] ?? -1;
export const vendorRole = (role: string) =>
  ['vendor_admin', 'vendor', 'staff'].includes(role);
