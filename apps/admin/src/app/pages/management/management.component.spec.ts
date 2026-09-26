import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { ManagementPage } from './management.component';
import { AuthService } from '../../core/auth/auth.service';
const snapshot = {
  permissions: ['products', 'categories', 'reports'],
  users: [],
  vendors: [],
  types: [],
  categories: [{ id: 'cat', name: 'Category', vendorId: null }],
  fields: [
    {
      id: 'field',
      name: 'Material',
      vendorId: 'vendor',
      data: { type: 'choice', required: true, options: ['Cotton'] },
    },
  ],
  products: [],
  orders: [],
  audit: [],
  stats: { products: 0 },
};
describe('Management workspace', () => {
  beforeEach(async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...snapshot, states: [], districts: [] }),
      }),
    );
    await TestBed.configureTestingModule({
      imports: [ManagementPage],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { section: 'products' } } } },
        {
          provide: AuthService,
          useValue: {
            user: signal({
              id: 'user',
              role: 'vendor_admin',
              userType: 'Vendor admin',
              vendorId: 'vendor',
            }),
          },
        },
      ],
    }).compileComponents();
  });
  afterEach(() => vi.unstubAllGlobals());
  it('renders vendor custom fields and submits prices as minor units', async () => {
    const fixture = TestBed.createComponent(ManagementPage);
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const addButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Add product'))!;
    addButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Material');
    page.draft = {
      ...page.draft,
      name: 'Shirt',
      description: 'Cotton shirt',
      sku: 'SKU',
      categoryId: 'cat',
      price: 12.34,
    };
    page.custom = { field: 'Cotton' };
    await page.save();
    const calls = vi.mocked(fetch).mock.calls;
    const call = calls.find((c) => String(c[0]).endsWith('/product'))!;
    expect(JSON.parse(String(call[1]?.body)).data).toMatchObject({
      priceMinor: 1234,
      fields: { field: 'Cotton' },
    });
    expect(page.formKind).toBe('');
    expect(page.notice()).toContain('Saved');
  });
  it('preserves unsaved form data when a stale update is rejected', async () => {
    const fixture = TestBed.createComponent(ManagementPage);
    await fixture.whenStable();
    const page = fixture.componentInstance;
    page.start('product');
    page.draft['name'] = 'Unsaved shirt';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'This record changed. Reload before saving.' }),
    } as Response);
    await page.save();
    expect(page.error()).toContain('changed');
    expect(page.draft['name']).toBe('Unsaved shirt');
    expect(page.formKind).toBe('product');
  });
  it('keeps order acceptance separate from management permissions', async () => {
    const fixture = TestBed.createComponent(ManagementPage);
    await fixture.whenStable();
    const page = fixture.componentInstance;
    page.snapshot.set({ ...page.snapshot()!, permissions: ['orders_accept'] });
    expect(page.can('orders_accept')).toBe(true);
    expect(page.can('orders_manage')).toBe(false);
    expect(page.can('team')).toBe(false);
  });
  it('uses server-provided lower types and requires regional selection', async () => {
    const fixture = TestBed.createComponent(ManagementPage);
    await fixture.whenStable();
    const page = fixture.componentInstance;
    const type = {
      id: 'district-type',
      name: 'District Admin',
      kind: 'type',
      status: 'active',
      state: '',
      district: '',
      vendorId: '',
      version: 1,
      createdAt: '',
      data: { role: 'district_admin', rank: 40, permissions: ['vendors'] },
    };
    page.snapshot.set({
      ...page.snapshot()!,
      assignableTypes: [type],
      permissions: ['team'],
      typeLevels: [{ role: 'agent', permissions: ['vendors'] }],
      hierarchy: 50,
    });
    page.start('users');
    page.draft['userTypeId'] = 'district-type';
    expect(page.selectedRole).toBe('district_admin');
    expect(page.availableTypes.map((t) => t.id)).toEqual(['district-type']);
    page.geography.set({
      states: [{ id: 1, name: 'State A' }],
      districts: [
        { id: 1, state: 'State A', name: 'District A' },
        { id: 2, state: 'State B', name: 'District B' },
      ],
    });
    page.draft['state'] = 'State A';
    expect(page.districtOptions.map((d) => d.name)).toEqual(['District A']);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('mat-select[name="state"]').getAttribute('aria-required'),
    ).toBe('true');
    expect(
      fixture.nativeElement
        .querySelector('mat-select[name="district"]')
        .getAttribute('aria-required'),
    ).toBe('true');
  });
  it('allows a vendor-specific type to be selected before selecting its vendor', async () => {
    const fixture = TestBed.createComponent(ManagementPage);
    await fixture.whenStable();
    const page = fixture.componentInstance;
    const type = {
      id: 'scoped',
      name: 'Vendor team',
      kind: 'type',
      status: 'active',
      state: 'State A',
      district: 'District A',
      vendorId: 'vendor',
      version: 1,
      createdAt: '',
      data: { role: 'staff' },
    };
    page.snapshot.set({
      ...page.snapshot()!,
      assignableTypes: [type],
      vendorOptions: [
        { id: 'vendor', name: 'Vendor', status: 'active' },
        { id: 'other', name: 'Other', status: 'active' },
      ],
    });
    page.start('users');
    page.draft['vendorId'] = '';
    expect(page.availableTypes).toContain(type);
    page.draft['userTypeId'] = 'scoped';
    page.selectUserType();
    expect(page.draft['vendorId']).toBe('vendor');
    expect(page.vendorOptions.map((v) => v.id)).toEqual(['vendor']);
  });
});
