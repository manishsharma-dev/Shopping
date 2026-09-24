import { Component } from '@angular/core';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  template: `
    <section class="page">
      <h2>Settings</h2>
      <ul class="list">
        <li>Platform configuration</li>
        <li>Tax and shipping rules</li>
        <li>Security and policies</li>
        <li>SEO and marketing</li>
      </ul>
    </section>
  `,
  styles: [
    `
      .page { display:grid; gap:1rem; }
      h2 { margin:0; }
      .list { list-style:none; padding:0; margin:0; display:grid; gap:0.75rem; }
      .list li { background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.8rem; padding:0.9rem 1rem; }
    `,
  ],
})
export class SettingsPage {}
