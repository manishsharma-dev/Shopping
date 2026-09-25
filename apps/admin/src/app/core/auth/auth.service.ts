import { Injectable, signal } from '@angular/core';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role:
    | 'customer'
    | 'superadmin'
    | 'admin'
    | 'vendor'
    | 'vendor_admin'
    | 'state_admin'
    | 'district_admin'
    | 'staff';
  userType?: string;
  userTypeId?: string;
  state?: string;
  district?: string;
  vendorId?: string;
  active?: boolean;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<SessionUser | null>(null);
  private readonly base = 'http://localhost:3000/api/auth';
  private restored = false;
  private restoring?: Promise<void>;

  async restore() {
    if (this.restored) return;
    this.restoring ??= this.request('/me')
      .then((result) => {
        this.user.set(result.user);
        this.restored = true;
      })
      .catch((error) => {
        if (error.status === 401) {
          this.user.set(null);
          this.restored = true;
        } else throw error;
      })
      .finally(() => {
        this.restoring = undefined;
      });
    return this.restoring;
  }
  async login(email: string, password: string) {
    const result = await this.request('/login', { email, password });
    this.user.set(result.user);
    this.restored = true;
  }
  async register(name: string, email: string, password: string) {
    const result = await this.request('/register', { name, email, password });
    this.user.set(result.user);
    this.restored = true;
  }
  async logout() {
    await this.request('/logout', {});
    this.user.set(null);
    this.restored = true;
  }
  private async request(path: string, body?: object): Promise<{ user: SessionUser }> {
    let response: Response;
    try {
      response = await fetch(this.base + path, {
        method: body ? 'POST' : 'GET',
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json', 'X-Shopping-Client': 'web' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('Cannot reach the server. Please try again.');
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) this.user.set(null);
      throw Object.assign(
        new Error(
          Array.isArray(data.message) ? data.message.join('. ') : data.message || 'Request failed',
        ),
        { status: response.status },
      );
    }
    return response.status === 204 ? ({} as { user: SessionUser }) : response.json();
  }
}
