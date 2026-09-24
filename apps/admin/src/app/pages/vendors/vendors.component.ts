import { Component } from '@angular/core';

@Component({
  selector: 'app-vendors-page',
  standalone: true,
  template: `
    <section class="page">
      <h2>Vendors</h2>
      <div class="cards">
        <article><span>Northwind Labs</span><strong>Active</strong></article>
        <article><span>Blue River Goods</span><strong>Pending review</strong></article>
        <article><span>Helio Goods</span><strong>Approved</strong></article>
      </div>
    </section>
  `,
  styles: [
    `
      .page { display:grid; gap:1rem; }
      h2 { margin:0; }
      .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem; }
      article { background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.8rem; padding:1rem; display:grid; gap:0.35rem; }
      article span { color:#475569; }
      strong { font-size:1.1rem; }
    `,
  ],
})
export class VendorsPage {}
