import { Routes } from '@angular/router';
import { AccountPage } from './pages/account/account.component';
import { CartPage } from './pages/cart/cart.component';
import { CatalogPage } from './pages/catalog/catalog.component';
import { CheckoutPage } from './pages/checkout/checkout.component';
import { HomePage } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'catalog', component: CatalogPage },
  { path: 'cart', component: CartPage },
  { path: 'checkout', component: CheckoutPage },
  { path: 'account', component: AccountPage },
];
