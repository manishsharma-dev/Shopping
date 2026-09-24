import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CartStore } from '../../core/stores/cart.store';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <section class="page">
      <h2>Your cart</h2>
      <div class="summary">
        <p>Items: {{ cart.itemCount() }}</p>
        <p>Total: {{ cart.totalAmount() | currency }}</p>
      </div>
      <button class="primary" (click)="cart.clearCart()">Clear cart</button>
    </section>
  `,
  styles: [
    `
      .page { display:grid; gap:1rem; }
      h2 { margin:0; }
      .summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.8rem; padding:1rem; display:flex; justify-content:space-between; }
      .primary { align-self:flex-start; border:none; background:#7c3aed; color:white; padding:0.75rem 1rem; border-radius:0.7rem; }
    `,
  ],
})
export class CartPage {
  protected readonly cart = inject(CartStore);
}
