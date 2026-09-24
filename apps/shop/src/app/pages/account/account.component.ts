import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './account.component.html',
})
export class AccountPage {
  readonly auth = inject(AuthService);
  readonly registering = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly loading = signal(true);
  readonly hidePassword = signal(true);
  name = '';
  email = '';
  password = '';
  constructor() {
    void this.auth
      .restore()
      .catch((e) => this.error.set(e.message))
      .finally(() => this.loading.set(false));
  }
  switchMode() {
    this.registering.update((value) => !value);
    this.error.set('');
    this.password = '';
    this.hidePassword.set(true);
  }
  async submit() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      if (this.registering()) await this.auth.register(this.name, this.email, this.password);
      else await this.auth.login(this.email, this.password);
      this.password = '';
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
  async logout() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.logout();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
