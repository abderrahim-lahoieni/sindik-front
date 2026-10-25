import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { Role } from './models/auth.model';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return auth.ensureValidAccessToken().pipe(
    map(() => {
      const requiredRoles = route.data?.['roles'] as Role[] | undefined;
      const userRole = auth.getRole();
      return !requiredRoles || (!!userRole && requiredRoles.includes(userRole))
        ? true
        : router.parseUrl('/access-denied');
    }),
    catchError(() => of(router.parseUrl('/login')))
  );
};
