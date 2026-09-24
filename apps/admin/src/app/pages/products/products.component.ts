import { Component } from '@angular/core';

@Component({
  selector: 'app-products-page',
  standalone: true,
  template: `
    <section class="page">
      <h2>Products</h2>
      <div class="cards">
        <article><span>Premium Hoodie</span><strong>89.00</strong></article>
        <article><span>Running Sneakers</span><strong>129.00</strong></article>
        <article><span>Travel Backpack</span><strong>149.00</strong></article>
      </div>
    </section>
  `,
  styles: [
    `
      .page { display:grid; gap:1rem; }
      h2 { margin:0; }
      .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; }
      article { background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.8rem; padding:1rem; display:grid; gap:0.35rem; }
      article span { color:#475569; }
      strong { font-size:1.2rem; }
    `,
  ],
})
export class ProductsPage {}
