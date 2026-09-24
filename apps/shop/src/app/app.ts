import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartStore } from './core/stores/cart.store';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
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
