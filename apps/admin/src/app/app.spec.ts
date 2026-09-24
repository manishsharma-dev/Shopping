import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { AuthService, SessionUser } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';

describe('Admin sign-in and theme', () => {
  let auth: {
    user: ReturnType<typeof signal<SessionUser | null>>;
    restore: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    auth = {
      user: signal<SessionUser | null>(null),
      restore: vi.fn().mockResolvedValue(undefined),
      login: vi.fn().mockImplementation(async () => {
        auth.user.set({
          id: 'admin',
          name: 'Super Admin',
          email: 'admin@example.com',
          role: 'superadmin',
        });
      }),
      logout: vi.fn().mockImplementation(async () => {
        auth.user.set(null);
      }),
    };
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), { provide: AuthService, useValue: auth }],
    }).compileComponents();
  });
  async function openLogin() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/login');
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it('renders the login outside the dashboard grid and redirects a signed-in superadmin', async () => {
    const fixture = await openLogin();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.app-shell')?.classList.contains('authenticated')).toBe(false);
    expect(element.querySelector('mat-form-field')).toBeTruthy();
    for (const [name, value] of [
      ['email', 'admin@example.com'],
      ['password', 'example-password-123'],
    ]) {
      const input = element.querySelector('input[name=' + name + ']') as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await fixture.whenStable();
    fixture.detectChanges();
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(auth.login).toHaveBeenCalledWith('admin@example.com', 'example-password-123');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
    expect(element.querySelector('.app-shell')?.classList.contains('authenticated')).toBe(true);
    expect(element.textContent).toContain('Marketplace dashboard');
  });
  it('redirects signed-out dashboard navigation to login', async () => {
    await openLogin();
    await TestBed.inject(Router).navigateByUrl('/dashboard');
    expect(TestBed.inject(Router).url).toBe('/login');
  });
  it('toggles both theme state and persistent preference', async () => {
    const fixture = await openLogin();
    const theme = TestBed.inject(ThemeService);
    const initial = theme.mode();
    const button = fixture.nativeElement.querySelector(
      'app-theme-toggle button',
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    expect(theme.mode()).not.toBe(initial);
    expect(document.documentElement.getAttribute('data-theme')).toBe(theme.mode());
    expect(localStorage.getItem('northstar-theme')).toBe(theme.mode());
  });
  it('restores a saved dark preference', () => {
    localStorage.setItem('northstar-theme', 'dark');
    expect(TestBed.inject(ThemeService).mode()).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});
