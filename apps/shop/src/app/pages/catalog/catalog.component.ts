import { Component } from '@angular/core';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  template: `
    <section class="page">
      <h2>Browse the catalog</h2>
      <div class="cards">
        <article>
          <span>Premium Hoodie</span>
          <strong>$89</strong>
          <button>Add to cart</button>
        </article>
        <article>
          <span>Running Sneakers</span>
          <strong>$129</strong>
          <button>Add to cart</button>
        </article>
        <article>
          <span>Travel Backpack</span>
          <strong>$149</strong>
          <button>Add to cart</button>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .page { display:grid; gap:1rem; }
      h2 { margin:0; }
      .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem; }
      article { background:#f8fafc; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem; display:grid; gap:0.6rem; }
      button { border:none; background:#111827; color:white; padding:0.7rem 1rem; border-radius:0.7rem; }
    `,
  ],
})
export class CatalogPage {}
