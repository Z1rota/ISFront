import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../service/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const url = new URL(request.url, window.location.origin);
  const isBackend = url.origin === window.location.origin && url.pathname.startsWith('/api/');
  if (!isBackend || url.pathname.startsWith('/api/auth/')) {
    return next(request);
  }

  const authService = inject(AuthService);
  const token = authService.token;
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      // A late response from a previous session must not log out a newly signed-in user.
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        authService.token === token
      ) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
