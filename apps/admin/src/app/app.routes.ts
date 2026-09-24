import { adminGuard } from './core/auth/auth.guard';
import { LoginPage } from './pages/login/login.component';
import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard/dashboard.component';
import { ProductsPage } from './pages/products/products.component';
import { SettingsPage } from './pages/settings/settings.component';
import { UsersPage } from './pages/users/users.component';
import { VendorsPage } from './pages/vendors/vendors.component';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardPage, canActivate: [adminGuard] },
  { path: 'users', component: UsersPage, canActivate: [adminGuard] },
  { path: 'vendors', component: VendorsPage, canActivate: [adminGuard] },
  { path: 'products', component: ProductsPage, canActivate: [adminGuard] },
  { path: 'settings', component: SettingsPage, canActivate: [adminGuard] },
];
