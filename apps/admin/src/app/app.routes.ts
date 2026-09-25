import { adminGuard } from './core/auth/auth.guard';
import { LoginPage } from './pages/login/login.component';
import { Routes } from '@angular/router';
import { ManagementPage } from './pages/management/management.component';
export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  ...['dashboard', 'users', 'vendors', 'products', 'settings', 'roles', 'orders'].map(
    (section) => ({
      path: section,
      component: ManagementPage,
      canActivate: [adminGuard],
      data: { section },
    }),
  ),
];
