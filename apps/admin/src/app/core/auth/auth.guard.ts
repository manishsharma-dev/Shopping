import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    await auth.restore();
  } catch {
    return router.createUrlTree(['/login']);
  }
  return (
    [
      'admin',
      'superadmin',
      'state_admin',
      'district_admin',
      'vendor_admin',
      'vendor',
      'staff',
    ].includes(auth.user()?.role ?? '') || router.createUrlTree(['/login'])
  );
};
