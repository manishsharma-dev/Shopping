import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { AuthService, SessionUser } from './core/auth/auth.service';

describe('Storefront account', () => {
  let auth: {
    user: ReturnType<typeof signal<SessionUser | null>>;
    restore: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  beforeEach(async () => {
    localStorage.clear();
    auth = {
      user: signal<SessionUser | null>(null),
      restore: vi.fn().mockResolvedValue(undefined),
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), { provide: AuthService, useValue: auth }],
    }).compileComponents();
  });
  async function account() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/account');
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it('renders Material sign-in and reveals registration fields without losing the theme', async () => {
    const fixture = await account();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('mat-form-field').length).toBe(2);
    (element.querySelector('app-theme-toggle button') as HTMLButtonElement).click();
    await fixture.whenStable();
    const mode = document.documentElement.getAttribute('data-theme');
    (element.querySelector('.auth-switch') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelectorAll('mat-form-field').length).toBe(3);
    expect(element.querySelector('input[name=password]')?.getAttribute('minlength')).toBe('12');
    expect(document.documentElement.getAttribute('data-theme')).toBe(mode);
  });
  it('shows a signed-in identity and sign-out action', async () => {
    auth.user.set({
      id: 'customer',
      name: 'Customer',
      email: 'customer@example.com',
      role: 'customer',
    });
    const fixture = await account();
    expect(fixture.nativeElement.textContent).toContain('Hello, Customer.');
    expect(fixture.nativeElement.textContent).toContain('customer@example.com');
  });
});
