import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
export const navigation = [
  { label: 'Dashboard', path: '/dashboard', permissions: [] },
  { label: 'Users', path: '/users', permissions: ['team'] },
  { label: 'Vendors', path: '/vendors', permissions: ['vendors', 'vendors_approve'] },
  { label: 'Products', path: '/products', permissions: ['products'] },
  { label: 'User types', path: '/roles', permissions: ['types'] },
  { label: 'Orders', path: '/orders', permissions: ['orders_accept', 'orders_manage'] },
  { label: 'Categories & fields', path: '/settings', permissions: ['categories'] },
];
@Injectable({ providedIn: 'root' })
export class AccessService {
  private readonly auth = inject(AuthService);
  private readonly owner = signal<string | null>(null);
  private readonly granted = signal<string[]>([]);
  readonly permissions = computed(() =>
    this.owner() === this.auth.user()?.id ? this.granted() : [],
  );
  readonly menu = computed(() =>
    navigation.filter(
      (item) =>
        !item.permissions.length || item.permissions.some((p) => this.permissions().includes(p)),
    ),
  );
  set(permissions: string[]) {
    this.owner.set(this.auth.user()?.id ?? null);
    this.granted.set(permissions);
  }
  canVisit(section: string) {
    const item = navigation.find((n) => n.path === '/' + section);
    return (
      !!item &&
      (!item.permissions.length || item.permissions.some((p) => this.permissions().includes(p)))
    );
  }
  async load() {
    this.set([]);
    const userId = this.auth.user()?.id;
    const response = await fetch('http://localhost:3000/api/manage/access', {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Your administration access is unavailable.');
    const result = await response.json();
    if (this.auth.user()?.id === userId) this.set(result.permissions);
  }
}
