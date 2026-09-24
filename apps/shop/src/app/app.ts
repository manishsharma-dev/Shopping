import { ThemeToggle } from './core/theme/theme-toggle.component';
import { MatButtonModule } from '@angular/material/button';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartStore } from './core/stores/cart.store';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggle, MatButtonModule],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly router = inject(Router);
  protected readonly cart = new CartStore();

  protected readonly navItems = [
    { label: 'Home', path: '/home' },
    { label: 'Catalog', path: '/catalog' },
    { label: 'Cart', path: '/cart' },
    { label: 'Checkout', path: '/checkout' },
    { label: 'Account', path: '/account' },
  ];

  constructor() {
    this.cart.addItem({
      id: 'prod_1001',
      name: 'Premium Hoodie',
      quantity: 1,
      unitPrice: 89,
    });
  }
}
