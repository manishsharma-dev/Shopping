import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  template: `
    <section class="page">
      <header>
        <div>
          <p class="eyebrow">Operations overview</p>
          <h2>Marketplace dashboard</h2>
        </div>
        <button class="primary">Export report</button>
      </header>

      <div class="stats-row">
        <article class="stat-card"><span>Revenue</span><strong>$128.4K</strong><small>+12.4% vs last month</small></article>
        <article class="stat-card"><span>Orders</span><strong>2,431</strong><small>+9.1% vs last week</small></article>
        <article class="stat-card"><span>Active vendors</span><strong>184</strong><small>14 pending approvals</small></article>
        <article class="stat-card"><span>Cart abandonment</span><strong>23%</strong><small>improving by 2.1%</small></article>
      </div>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1.5rem; }
      header { display:flex; justify-content:space-between; align-items:center; }
      .eyebrow { text-transform: uppercase; color:var(--mat-sys-primary); letter-spacing:0.12em; font-size:0.7rem; margin:0 0 0.3rem; }
      h2 { margin:0; font-size:2rem; }
      .primary { background:var(--mat-sys-primary); color:var(--mat-sys-on-primary); border:none; border-radius:0.75rem; padding:0.75rem 1rem; font-weight:600; }
      .stats-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem; }
      .stat-card { background:var(--mat-sys-surface-container-low); border:1px solid var(--mat-sys-outline-variant); border-radius:1rem; padding:1rem; display:grid; gap:0.4rem; }
      .stat-card span { color:var(--mat-sys-on-surface-variant); font-size:0.8rem; }
      .stat-card strong { font-size:2rem; }
      .stat-card small { color:var(--mat-sys-on-surface-variant); }
    `,
  ],
})
export class DashboardPage {}
