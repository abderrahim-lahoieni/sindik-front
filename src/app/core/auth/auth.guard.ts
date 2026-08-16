import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { Role } from './models/auth.model';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles = route.data?.['roles'] as Role[] | undefined;
  const userRole = auth.getRole();

  if (requiredRoles && (!userRole || !requiredRoles.includes(userRole))) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
