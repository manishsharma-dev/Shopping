import { ThemeToggle } from './core/theme/theme-toggle.component';
import { MatButtonModule } from '@angular/material/button';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggle, MatButtonModule],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly session = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly error = signal('');

  protected readonly navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/users' },
    { label: 'Vendors', path: '/vendors' },
    { label: 'Products', path: '/products' },
    { label: 'Settings', path: '/settings' },
  ];

  protected isWorkspace() {
    return (
      this.router.url !== '/login' &&
      ['admin', 'superadmin'].includes(this.session.user()?.role ?? '')
    );
  }

  async logout() {
    try {
      await this.session.logout();
      await this.router.navigateByUrl('/login');
    } catch {
      this.error.set('Sign out failed. Please try again.');
    }
  }
}
