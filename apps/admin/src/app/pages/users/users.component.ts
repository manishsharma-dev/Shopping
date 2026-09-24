import { Component } from '@angular/core';

@Component({
  selector: 'app-users-page',
  standalone: true,
  template: `
    <section class="page">
      <h2>Users & permissions</h2>
      <ul class="list">
        <li><span>Super Admin</span><strong>1 account</strong></li>
        <li><span>Admin</span><strong>4 accounts</strong></li>
        <li><span>Vendor Admins</span><strong>12 accounts</strong></li>
        <li><span>Customers</span><strong>6,813 active</strong></li>
      </ul>
    </section>
  `,
  styles: [
    `
      .page { display:grid; gap:1rem; }
      h2 { margin:0; }
      .list { list-style:none; display:grid; gap:0.75rem; padding:0; margin:0; }
      .list li { background:var(--mat-sys-surface-container-low); border:1px solid var(--mat-sys-outline-variant); border-radius:0.8rem; padding:0.9rem 1rem; display:flex; justify-content:space-between; align-items:center; }
    `,
  ],
})
export class UsersPage {}
