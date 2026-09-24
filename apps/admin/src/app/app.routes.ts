import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard/dashboard.component';
import { ProductsPage } from './pages/products/products.component';
import { SettingsPage } from './pages/settings/settings.component';
import { UsersPage } from './pages/users/users.component';
import { VendorsPage } from './pages/vendors/vendors.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardPage },
  { path: 'users', component: UsersPage },
  { path: 'vendors', component: VendorsPage },
  { path: 'products', component: ProductsPage },
  { path: 'settings', component: SettingsPage },
];
