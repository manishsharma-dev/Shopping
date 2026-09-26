import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AccessService } from './access.service';
export const adminGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const access = inject(AccessService);
  const router = inject(Router);
  try {
    await auth.restore();
    if (!auth.user() || auth.user()?.role === 'customer') return router.createUrlTree(['/login']);
    await access.load();
    return (
      access.canVisit(route.data['section'] || 'dashboard') || router.createUrlTree(['/dashboard'])
    );
  } catch {
    return router.createUrlTree(['/login']);
  }
};
