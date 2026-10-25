import { Injectable } from '@angular/core';
import { Role } from './models/auth.model';

export const AUTH_STORAGE_KEYS = {
  accessToken: 'jwt_token',
  refreshToken: 'refresh_token',
  role: 'user_role',
  username: 'user_username',
  uuid: 'user_uuid'
} as const;

const LEGACY_ACCESS_TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  load(): void {
    if (!localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)) {
      const legacyToken = localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
      if (legacyToken) localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, legacyToken);
    }
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  }

  saveAuth(data: {
    token: string;
    refreshToken: string;
    role: Role;
    username: string;
    uuid?: string | null;
  }): void {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, data.token);
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, data.refreshToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.role, data.role);
    localStorage.setItem(AUTH_STORAGE_KEYS.username, data.username);
    if (data.uuid) localStorage.setItem(AUTH_STORAGE_KEYS.uuid, data.uuid);
    else localStorage.removeItem(AUTH_STORAGE_KEYS.uuid);
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  }

  getAccessToken(): string | null {
    this.load();
    return localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
  }

  getRole(): Role | null {
    const role = localStorage.getItem(AUTH_STORAGE_KEYS.role);
    return role && Object.values(Role).includes(role as Role) ? (role as Role) : null;
  }

  getUsername(): string | null {
    return localStorage.getItem(AUTH_STORAGE_KEYS.username);
  }

  getUuid(): string | null {
    return localStorage.getItem(AUTH_STORAGE_KEYS.uuid);
  }

  clear(): void {
    Object.values(AUTH_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  }
}
