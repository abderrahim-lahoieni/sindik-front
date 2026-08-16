import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStore {
  private readonly _token = signal<string | null>(null);

  readonly token = this._token.asReadonly();

  set(token: string): void {
    this._token.set(token);
    localStorage.setItem('access_token', token);
  }

  load(): void {
    const token = localStorage.getItem('access_token');
    this._token.set(token);
  }

  clear(): void {
    this._token.set(null);
    localStorage.removeItem('access_token');
  }
}
