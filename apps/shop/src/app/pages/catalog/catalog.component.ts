import { Component, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CurrencyPipe],
  template: `<section>
    <h2>Browse the catalog</h2>
    @if (loading()) {
      <p role="status">Loading products...</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
      <button (click)="load()">Retry</button>
    }
    <div class="cards">
      @for (p of products(); track p.id) {
        <article>
          <h3>{{ p.name }}</h3>
          <p>{{ p.description }}</p>
          <strong>{{ p.price | currency: 'INR' }}</strong>
          <p>{{ p.stock > 0 ? 'In stock' : 'Out of stock' }}</p>
        </article>
      } @empty {
        @if (!loading() && !error()) {
          <p>No products available yet.</p>
        }
      }
    </div>
  </section>`,
  styles: [
    `
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;
      }
      article {
        padding: 24px;
        border-radius: 16px;
        border: 1px solid var(--mat-sys-outline-variant);
        background: var(--mat-sys-surface-container-low);
      }
    `,
  ],
})
export class CatalogPage {
  readonly products = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  constructor() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const r = await fetch('http://localhost:3000/api/catalog');
      if (!r.ok) throw new Error('Cannot load products. Please try again.');
      this.products.set((await r.json()).items);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
