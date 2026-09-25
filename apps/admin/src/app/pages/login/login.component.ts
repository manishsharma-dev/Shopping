import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeToggle } from '../../core/theme/theme-toggle.component';

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, ThemeToggle],
  templateUrl: './login.component.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  email = '';
  password = '';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly hidePassword = signal(true);
  async submit() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.email, this.password);
      this.password = '';
      if (
        ![
          'admin',
          'superadmin',
          'state_admin',
          'district_admin',
          'vendor_admin',
          'vendor',
          'staff',
        ].includes(this.auth.user()!.role)
      ) {
        await this.auth.logout();
        throw new Error('This account does not have administrator access.');
      }
      await this.router.navigateByUrl('/dashboard');
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
