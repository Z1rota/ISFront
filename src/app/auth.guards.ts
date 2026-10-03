import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

export const authGuard: CanActivateFn = () =>
  inject(AuthService).isAuthenticated() || inject(Router).createUrlTree(['/login']);

// Used for the optional admin section inside /imports. USER matches the empty fallback route.
export const adminGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated()
    ? authService.isAdmin()
    : inject(Router).createUrlTree(['/login']);
};
