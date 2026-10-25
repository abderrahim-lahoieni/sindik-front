import { HttpErrorResponse, HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environements/environement';
import { AuthService } from './auth.service';

const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const apiUrl = new URL(environment.baseUrl);
  let requestUrl: URL;
  try {
    requestUrl = new URL(request.url, apiUrl);
  } catch {
    return next(request);
  }
  const isApiRequest = requestUrl.origin === apiUrl.origin &&
    (requestUrl.pathname === apiUrl.pathname || requestUrl.pathname.startsWith(`${apiUrl.pathname.replace(/\/$/, '')}/`));
  const isAuthRequest = /\/auth\/(login|register|refresh|logout)$/.test(requestUrl.pathname);
  const token = auth.getToken();
  const authorizedRequest = isApiRequest && !isAuthRequest && token && !request.headers.has('Authorization')
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError(error => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !isApiRequest ||
        isAuthRequest ||
        request.context.get(AUTH_RETRY)
      ) {
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap(response =>
          next(
            request.clone({
              context: request.context.set(AUTH_RETRY, true),
              setHeaders: { Authorization: `Bearer ${response.token}` }
            })
          )
        ),
        catchError(refreshError => {
          auth.expireSession();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
