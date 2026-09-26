import { AccessService } from './core/auth/access.service';
import { ThemeToggle } from './core/theme/theme-toggle.component';
import { MatButtonModule } from '@angular/material/button';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd } from '@angular/router';

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ThemeToggle,
    MatButtonModule,
    MatSidenavModule,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly session = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly error = signal('');
  protected readonly compact = signal(false);
  protected readonly desktopOpen = signal(true);
  protected readonly mobileOpen = signal(false);

  constructor() {
    inject(BreakpointObserver)
      .observe('(max-width: 960px)')
      .pipe(takeUntilDestroyed())
      .subscribe((result) => {
        this.compact.set(result.matches);
        this.mobileOpen.set(false);
      });
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) this.mobileOpen.set(false);
    });
  }

  protected sidebarOpen() {
    return this.isWorkspace() && (this.compact() ? this.mobileOpen() : this.desktopOpen());
  }

  protected setSidebarOpen(open: boolean) {
    if (this.compact()) this.mobileOpen.set(open);
    else this.desktopOpen.set(open);
  }

  protected closeMobileSidebar() {
    this.mobileOpen.set(false);
  }

  protected readonly access = inject(AccessService);
  protected isWorkspace() {
    return (
      this.router.url !== '/login' &&
      [
        'admin',
        'superadmin',
        'state_admin',
        'district_admin',
        'vendor_admin',
        'vendor',
        'staff',
        'agent',
      ].includes(this.session.user()?.role ?? '')
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
