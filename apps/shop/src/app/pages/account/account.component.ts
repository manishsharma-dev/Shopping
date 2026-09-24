import { Component } from '@angular/core';

@Component({
  selector: 'app-account-page',
  standalone: true,
  template: `
    <section class="page">
      <h2>My account</h2>
      <ul>
        <li>Orders</li>
        <li>Wishlist</li>
        <li>Saved addresses</li>
        <li>Payment methods</li>
      </ul>
    </section>
  `,
  styles: [
    `
      .page { display:grid; gap:1rem; }
      h2 { margin:0; }
      ul { list-style:none; margin:0; padding:0; display:grid; gap:0.7rem; }
      li { background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.85rem 1rem; }
    `,
  ],
})
export class AccountPage {}
