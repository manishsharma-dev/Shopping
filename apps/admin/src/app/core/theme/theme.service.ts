import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly mode = signal<'light' | 'dark'>('light');

  constructor() {
    const window = this.document.defaultView;
    let saved: string | null = null;
    try {
      saved = window?.localStorage.getItem('northstar-theme') ?? null;
    } catch {
      /* Storage can be disabled. */
    }
    this.apply(
      saved === 'light' || saved === 'dark'
        ? saved
        : window?.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light',
    );
  }

  toggle() {
    this.apply(this.mode() === 'dark' ? 'light' : 'dark');
    try {
      this.document.defaultView?.localStorage.setItem('northstar-theme', this.mode());
    } catch {
      /* Keep the in-memory preference. */
    }
  }

  private apply(mode: 'light' | 'dark') {
    this.mode.set(mode);
    this.document.documentElement.setAttribute('data-theme', mode);
    this.document.documentElement.style.colorScheme = mode;
  }
}
