import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';

type Row = {
  id: string;
  name: string;
  kind: string;
  status: string;
  state: string;
  district: string;
  vendorId: string;
  version: number;
  data: Record<string, any>;
  createdAt: string;
};
type Snapshot = {
  permissions: string[];
  users: any[];
  vendors: Row[];
  types: Row[];
  categories: Row[];
  fields: Row[];
  products: Row[];
  orders: Row[];
  audit: Row[];
  stats: Record<string, number> | null;
};
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
})
export class ManagementPage {
  readonly auth = inject(AuthService);
  readonly route = inject(ActivatedRoute);
  readonly snapshot = signal<Snapshot | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  section = this.route.snapshot.data['section'] || 'dashboard';
  filters = { state: '', district: '', vendorId: '' };
  formKind = '';
  editing?: Row;
  draft: Record<string, any> = {};
  custom: Record<string, any> = {};
  selectedPermissions: Record<string, boolean> = {};
  bundleSelection: Record<string, boolean> = {};
  pendingAction: { kind: string; row: any; status: string } | null = null;
  reason = '';
  typeTarget: any = null;
  typeId = '';
  async changeType() {
    if (!this.typeTarget || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.request('/users/' + this.typeTarget.id + '/type', {
        data: { userTypeId: this.typeId, reason: this.reason },
      });
      this.typeTarget = null;
      this.notice.set('User type updated.');
      this.snapshot.set(await this.request('?' + new URLSearchParams(this.filters)));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
  readonly permissionNames = [
    'products',
    'categories',
    'orders_accept',
    'orders_manage',
    'team',
    'reports',
  ];
  readonly titles: Record<string, string> = {
    dashboard: 'Marketplace dashboard',
    users: 'Users & access',
    vendors: 'Vendor approvals',
    products: 'Product workspace',
    settings: 'Categories & custom fields',
    orders: 'Order management',
    roles: 'User types & permissions',
  };
  constructor() {
    void this.load();
  }
  get isRegional() {
    return ['superadmin', 'admin', 'state_admin', 'district_admin'].includes(
      this.auth.user()?.role || '',
    );
  }
  get canCreateType() {
    return ['superadmin', 'admin', 'vendor_admin'].includes(this.auth.user()?.role || '');
  }
  can(permission: string) {
    return this.snapshot()?.permissions.includes(permission) ?? false;
  }
  get roles() {
    const role = this.auth.user()?.role;
    return role === 'superadmin'
      ? ['admin', 'state_admin', 'district_admin', 'vendor_admin', 'staff', 'customer']
      : role === 'admin'
        ? ['state_admin', 'district_admin', 'vendor_admin', 'staff', 'customer']
        : role === 'state_admin'
          ? ['district_admin', 'vendor_admin', 'staff']
          : role === 'district_admin'
            ? ['vendor_admin', 'staff']
            : ['staff'];
  }
  get vendorFields() {
    return (
      this.snapshot()?.fields.filter(
        (f) => f.vendorId === (this.auth.user()?.vendorId || this.draft['vendorId']),
      ) ?? []
    );
  }
  get vendorProducts() {
    return (
      this.snapshot()?.products.filter(
        (p) =>
          p.vendorId === (this.auth.user()?.vendorId || this.draft['vendorId']) &&
          p.status === 'active' &&
          !p.data['bundleIds']?.length &&
          p.id !== this.editing?.id,
      ) ?? []
    );
  }
  get availableCategories() {
    return (
      this.snapshot()?.categories.filter(
        (c) => !c.vendorId || c.vendorId === (this.auth.user()?.vendorId || this.draft['vendorId']),
      ) ?? []
    );
  }
  get availableTypes() {
    return (
      this.snapshot()?.types.filter(
        (c) => !c.vendorId || c.vendorId === (this.auth.user()?.vendorId || this.draft['vendorId']),
      ) ?? []
    );
  }
  label(value: string) {
    return value.replace(/([A-Z])/g, ' $1').replaceAll('_', ' ');
  }
  async request(path = '', data?: object) {
    const response = await fetch('http://localhost:3000/api/manage' + path, {
      method: data ? 'POST' : 'GET',
      credentials: 'include',
      headers: data ? { 'Content-Type': 'application/json', 'X-Shopping-Client': 'web' } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        Array.isArray(result.message)
          ? result.message.join('. ')
          : result.message || 'Request failed',
      );
    return result;
  }
  async load() {
    this.busy.set(true);
    this.error.set('');
    try {
      this.snapshot.set(await this.request('?' + new URLSearchParams(this.filters)));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
  start(kind: string, row?: Row) {
    this.formKind = kind;
    this.editing = row;
    this.error.set('');
    this.notice.set('');
    this.draft = row
      ? {
          name: row.name,
          vendorId: row.vendorId,
          status: row.status,
          ...row.data,
          price: row.data['priceMinor'] / 100,
        }
      : {
          name: '',
          role: this.roles[0],
          vendorId: this.auth.user()?.vendorId || '',
          state: this.auth.user()?.state || '',
          district: this.auth.user()?.district || '',
          type: 'text',
          required: false,
          status: 'draft',
          price: 0,
          discountPercent: 0,
          stock: 0,
          lowStock: 5,
          quantity: 1,
          optionsText: '',
        };
    this.custom = { ...row?.data['fields'] };
    this.selectedPermissions = {};
    this.bundleSelection = {};
    for (const id of row?.data['bundleIds'] ?? []) this.bundleSelection[id] = true;
  }
  cancel() {
    this.formKind = '';
    this.editing = undefined;
    this.draft = {};
    this.custom = {};
  }
  async save() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const data = { ...this.draft };
      if (this.formKind === 'type')
        data['permissions'] = this.permissionNames.filter((p) => this.selectedPermissions[p]);
      if (this.formKind === 'field')
        data['options'] = (data['optionsText'] || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      if (this.formKind === 'product') {
        data['priceMinor'] = Math.round(Number(data['price']) * 100);
        data['fields'] = this.custom;
        data['bundleIds'] = Object.keys(this.bundleSelection).filter(
          (id) => this.bundleSelection[id],
        );
      }
      if (this.formKind === 'order')
        data['lines'] = [{ productId: data['productId'], quantity: data['quantity'] }];
      await this.request('/' + this.formKind + (this.editing ? '/' + this.editing.id : ''), {
        data,
        version: this.editing?.version,
      });
      this.cancel();
      this.notice.set('Saved successfully.');
      this.snapshot.set(await this.request('?' + new URLSearchParams(this.filters)));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
  action(kind: string, row: any, status: string) {
    this.pendingAction = { kind, row, status };
    this.reason = '';
  }
  async confirmAction() {
    if (!this.pendingAction || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const a = this.pendingAction;
    try {
      await this.request('/' + a.kind + '/' + a.row.id + (a.kind === 'users' ? '/status' : ''), {
        version: a.row.version,
        data: {
          action: 'moderate',
          status: a.status,
          active: a.status === 'active',
          reason: this.reason,
        },
      });
      this.pendingAction = null;
      this.notice.set('Change recorded in the activity log.');
      this.snapshot.set(await this.request('?' + new URLSearchParams(this.filters)));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
  nextStatuses(status: string) {
    return (
      (
        {
          pending: ['accepted', 'cancelled'],
          accepted: ['processing', 'cancelled'],
          processing: ['shipped', 'cancelled'],
          shipped: ['fulfilled'],
        } as Record<string, string[]>
      )[status] ?? []
    );
  }
}
