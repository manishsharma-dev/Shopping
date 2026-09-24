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
      .summary { background:var(--mat-sys-surface-container-low); border:1px solid var(--mat-sys-outline-variant); border-radius:0.8rem; padding:1rem; display:flex; justify-content:space-between; }
      .primary { align-self:flex-start; border:none; background:var(--mat-sys-primary); color:var(--mat-sys-on-primary); padding:0.75rem 1rem; border-radius:0.7rem; }
    `,
  ],
})
export class CartPage {
  protected readonly cart = inject(CartStore);
}
