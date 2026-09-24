import { Component } from '@angular/core';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  template: `
    <section class="page">
      <h2>Checkout</h2>
      <div class="info-box">
        <p>Shipping address</p>
        <strong>24 Orchard Lane, New York</strong>
      </div>
      <button class="primary">Place order</button>
    </section>
  `,
  styles: [
    `
      .page { display:grid; gap:1rem; }
      h2 { margin:0; }
      .info-box { background:var(--mat-sys-surface-container-low); border:1px solid var(--mat-sys-outline-variant); border-radius:0.8rem; padding:1rem; }
      .primary { border:none; background:var(--mat-sys-primary); color:var(--mat-sys-on-primary); padding:0.8rem 1rem; border-radius:0.7rem; width:fit-content; }
    `,
  ],
})
export class CheckoutPage {}
