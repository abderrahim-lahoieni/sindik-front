import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthRequest, AuthResponse, Role } from './models/auth.model';
import { Router } from '@angular/router';
import ToastService from '../../features/components/ui/toast/toast.service';
import { Observable, tap, catchError, of, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router); // ✅ Inject Router au lieu de location.href
  private readonly api = 'http://localhost:8080/auth';
  private logoutTimer?: any;

  // ✅ Constantes pour éviter les erreurs de typo
  private readonly STORAGE_KEYS = {
    JWT: 'jwt_token',
    REFRESH: 'refresh_token',
    ROLE: 'user_role',
    USERNAME: 'user_username',
    UUID:'user_uuid'
  } as const;

  login(data: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, data).pipe(
      tap(response => {
        // ✅ Sauvegarder TOUTES les infos en une fois
        this.saveAuthData(response);
      })
    );
  }

  // ✅ LOGOUT PROFESSIONNEL
  logout(showMessage = false, isExpired = false): void {
    const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH);
    const accessToken = localStorage.getItem(this.STORAGE_KEYS.JWT);

    // 1. Appeler le backend pour invalider le refresh token (si présent)
    if (refreshToken) {
      this.http.post(`${this.api}/logout`, { refreshToken }, {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
      }).pipe(
        catchError(error => {
          console.error('Logout API error:', error);
          return of(null);
        }),
        finalize(() => {
          // 2. Nettoyer le localStorage dans tous les cas
          this.clearLocalStorage();
        })
      ).subscribe();
    } else {
      // Pas de refresh token, nettoyer directement
      this.clearLocalStorage();
    }

    // 3. Arrêter le timer auto-logout
    this.stopAutoLogout();

    // 4. Afficher message si nécessaire
    if (showMessage) {
      const message = isExpired ? 'Votre session a expiré.' : 'Déconnexion réussie.';
      this.toast.info(message);
    }

    // 5. Rediriger vers login
    this.router.navigate(['/login']).then(r => console.log(r));
  }

  // ✅ Nouvelle méthode pour sauvegarder les données d'auth
  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem(this.STORAGE_KEYS.JWT, response.token);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH, response.refreshToken);
    localStorage.setItem(this.STORAGE_KEYS.ROLE, response.role);
    localStorage.setItem(this.STORAGE_KEYS.USERNAME, response.username);
    localStorage.setItem(this.STORAGE_KEYS.UUID,response.uuid)

    // Démarrer l'auto-logout si expiresIn est fourni
    if (response.expiresIn) {
      this.startAutoLogout(response.expiresIn);
    }
  }

  // ✅ Méthode centralisée pour nettoyer le localStorage
  private clearLocalStorage(): void {
    localStorage.removeItem(this.STORAGE_KEYS.JWT);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH);
    localStorage.removeItem(this.STORAGE_KEYS.ROLE);
    localStorage.removeItem(this.STORAGE_KEYS.USERNAME);
  }

  // ✅ Arrêter proprement le timer
  private stopAutoLogout(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = undefined;
    }
  }

  startAutoLogout(expiresInHours: number): void {
    this.stopAutoLogout(); // Nettoie l'ancien timer

    // Convertir en millisecondes
    const expiresInMs = expiresInHours * 60 * 60 * 1000;

    this.logoutTimer = setTimeout(() => {
      this.logout(true, true); // true = show message, true = isExpired
    }, expiresInMs);
  }
  // ✅ Getters avec valeurs par défaut
  getRole(): Role | null {
    return localStorage.getItem(this.STORAGE_KEYS.ROLE) as Role | null;
  }

  getUsername(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.USERNAME);
  }

  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.JWT);
  }
  getUsernameUUid(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.UUID);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // ✅ Optionnel: Vérifier si le token n'est pas expiré
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir en millisecondes
      return Date.now() < exp;
    } catch {
      return false;
    }
  }
}
