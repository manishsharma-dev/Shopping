import { Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  template: `
    <section class="hero">
      <div>
        <p class="eyebrow">Fresh arrivals</p>
        <h1>Shop smarter.</h1>
        <p class="subtitle">Curated essentials for homes, work, and everyday life.</p>
        <button class="primary">Shop now</button>
      </div>
      <div class="feature-panel">
        <span>Free delivery over $75</span>
        <strong>New collection</strong>
      </div>
    </section>
  `,
  styles: [
    `
      .hero { display:grid; grid-template-columns:1.2fr 0.8fr; gap:1.5rem; align-items:center; }
      .eyebrow { text-transform: uppercase; letter-spacing:0.12em; color:var(--mat-sys-primary); font-size:0.72rem; margin:0 0 0.5rem; }
      h1 { margin:0; font-size:3rem; }
      .subtitle { max-width:28rem; color:var(--mat-sys-on-surface-variant); }
      .primary { background:var(--mat-sys-primary); color:var(--mat-sys-on-primary); border:none; border-radius:0.8rem; padding:0.85rem 1.2rem; font-weight:600; margin-top:1rem; }
      .feature-panel { background:var(--mat-sys-primary-container); border-radius:1.5rem; padding:1.5rem; min-height:220px; display:flex; flex-direction:column; justify-content:space-between; }
      .feature-panel span { font-weight:600; color:var(--mat-sys-primary); }
      .feature-panel strong { font-size:2rem; }
      @media (max-width: 700px) { .hero { grid-template-columns:1fr; } }
    `,
  ],
})
export class HomePage {}
