import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environements/environement';
import ToastService from '../../features/components/ui/toast/toast.service';
import { AuthResponse, Role } from './models/auth.model';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { AUTH_STORAGE_KEYS, TokenStore } from './token.store';

function tokenExpiringIn(seconds: number): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${payload}.signature`;
}

function authResponse(token: string, refreshToken = 'refresh-token'): AuthResponse {
  return {
    token,
    refreshToken,
    username: 'resident@example.com',
    role: Role.R,
    uuid: 'user-uuid',
    expiresIn: 1
  };
}

describe('frontend authentication contract', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;
  let tokenStore: TokenStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: { info: vi.fn(), success: vi.fn() } }
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    tokenStore = TestBed.inject(TokenStore);
  });

  afterEach(() => {
    auth.expireSession();
    controller.verify();
  });

  it('uses the backend login JSON contract and stores tokens through TokenStore', () => {
    let result: AuthResponse | undefined;
    const accessToken = tokenExpiringIn(3600);
    auth.login({ email: 'resident@example.com', password: 'password123' }).subscribe(value => result = value);

    const request = controller.expectOne(`${environment.baseUrl}/auth/login`);
    expect(request.request.body).toEqual({ email: 'resident@example.com', password: 'password123' });
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(authResponse(accessToken));

    expect(result?.token).toBe(accessToken);
    expect(tokenStore.getAccessToken()).toBe(result?.token);
    expect(tokenStore.getRefreshToken()).toBe('refresh-token');
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.uuid)).toBe('user-uuid');
  });

  it('renews once after a 401 and retries with the rotated access token', () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, tokenExpiringIn(-60));
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, 'stored-refresh');
    http.get(`${environment.baseUrl}/api/admin/users`).subscribe();

    const original = controller.expectOne(`${environment.baseUrl}/api/admin/users`);
    expect(original.request.headers.has('Authorization')).toBe(true);
    original.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = controller.expectOne(`${environment.baseUrl}/auth/refresh`);
    expect(refresh.request.body).toEqual({ refreshToken: 'stored-refresh' });
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    const rotatedAccessToken = tokenExpiringIn(3600);
    refresh.flush(authResponse(rotatedAccessToken, 'rotated-refresh'));

    const retried = controller.expectOne(`${environment.baseUrl}/api/admin/users`);
    expect(retried.request.headers.get('Authorization')).toBe(`Bearer ${rotatedAccessToken}`);
    retried.flush([]);
    expect(tokenStore.getRefreshToken()).toBe('rotated-refresh');
  });

  it('does not try refresh on a 403 response', () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, tokenExpiringIn(3600));
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, 'stored-refresh');
    let failure: unknown;
    http.get(`${environment.baseUrl}/api/admin/users`).subscribe({ error: error => failure = error });

    controller.expectOne(`${environment.baseUrl}/api/admin/users`)
      .flush({}, { status: 403, statusText: 'Forbidden' });

    expect(failure).toBeInstanceOf(HttpErrorResponse);
    controller.expectNone(`${environment.baseUrl}/auth/refresh`);
  });
});
