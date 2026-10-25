import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environements/environement';
import ToastService from '../../features/components/ui/toast/toast.service';
import { AuthRequest, AuthResponse, Role } from './models/auth.model';
import { TokenStore } from './token.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly tokenStore = inject(TokenStore);
  private readonly api = `${environment.baseUrl}/auth`;
  private logoutTimer?: ReturnType<typeof setTimeout>;
  private refreshInFlight?: Observable<AuthResponse>;

  login(data: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, data).pipe(
      tap(response => this.saveAuthData(response))
    );
  }

  refreshSession(): Observable<AuthResponse> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const refreshToken = this.tokenStore.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token available'));

    this.refreshInFlight = this.http
      .post<AuthResponse>(`${this.api}/refresh`, { refreshToken })
      .pipe(
        tap(response => this.saveAuthData(response)),
        catchError(error => {
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => (this.refreshInFlight = undefined)),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    return this.refreshInFlight;
  }

  ensureValidAccessToken(): Observable<string> {
    const token = this.getToken();
    if (token && !this.isExpired(token)) return of(token);
    if (this.tokenStore.getRefreshToken()) {
      return this.refreshSession().pipe(map(response => response.token));
    }
    this.clearSession();
    return throwError(() => new Error('Session expired'));
  }

  logout(showMessage = false, isExpired = false): void {
    const refreshToken = this.tokenStore.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.api}/logout`, { refreshToken }).pipe(catchError(() => of(null))).subscribe();
    }

    this.clearSession();
    if (showMessage) {
      this.toast.info(isExpired ? 'Votre session a expiré.' : 'Déconnexion réussie.');
    }
    void this.router.navigate(['/login']);
  }

  expireSession(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  startAutoLogout(expiresInHours: number): void {
    this.scheduleRefresh(undefined, expiresInHours);
  }

  getRole(): Role | null {
    return this.tokenStore.getRole();
  }

  getUsername(): string | null {
    return this.tokenStore.getUsername();
  }

  getToken(): string | null {
    return this.tokenStore.getAccessToken();
  }

  getUsernameUUid(): string | null {
    return this.tokenStore.getUuid();
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isExpired(token);
  }

  private saveAuthData(response: AuthResponse): void {
    this.tokenStore.saveAuth(response);
    this.scheduleRefresh(response.token, response.expiresIn);
  }

  private scheduleRefresh(token?: string, expiresInHours?: number): void {
    this.stopAutoLogout();
    const expiry = token ? this.getExpiry(token) : undefined;
    const fallbackDelay = expiresInHours ? expiresInHours * 60 * 60 * 1000 : undefined;
    const delay = expiry ? expiry - Date.now() - 30_000 : fallbackDelay;
    if (delay === undefined) return;

    this.logoutTimer = setTimeout(() => {
      if (!this.tokenStore.getRefreshToken()) {
        this.expireSession();
        return;
      }
      this.refreshSession().subscribe({ error: () => this.expireSession() });
    }, Math.max(0, delay));
  }

  private stopAutoLogout(): void {
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    this.logoutTimer = undefined;
  }

  private clearSession(): void {
    this.stopAutoLogout();
    this.tokenStore.clear();
  }

  private isExpired(token: string): boolean {
    const expiry = this.getExpiry(token);
    return expiry === undefined || expiry <= Date.now();
  }

  private getExpiry(token: string): number | undefined {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return undefined;
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : undefined;
    } catch {
      return undefined;
    }
  }
}
