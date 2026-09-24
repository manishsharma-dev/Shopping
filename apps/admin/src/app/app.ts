import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionStore } from './core/stores/session.store';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly session = new SessionStore();

  protected readonly navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/users' },
    { label: 'Vendors', path: '/vendors' },
    { label: 'Products', path: '/products' },
    { label: 'Settings', path: '/settings' },
  ];

  constructor() {
    this.session.login({
      id: 'adm-1001',
      name: 'Alicia Johnson',
      role: 'superadmin',
    });
  }
}
