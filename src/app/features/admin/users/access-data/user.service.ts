
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {User, UserCreateRequest, UserUpdateRequest} from './user.model';
import {environment} from '../../../../../environements/environement';

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.baseUrl}/users`;
  // ========================================
  // CRUD OPERATIONS
  // ========================================

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.api);
  }

  getUsers(filters?: { role?: string; active?: boolean }) {
    let params: any = {};

    if (filters?.role) params.role = filters.role;
    if (filters?.active !== undefined) params.active = filters.active;

    return this.http.get<User[]>(this.api, { params });
  }


  getUserByUuid(uuid: string): Observable<User> {
    return this.http.get<User>(`${this.api}/${uuid}`);
  }

  createUser(request: UserCreateRequest): Observable<User> {
    return this.http.post<User>(this.api, request);
  }

  updateUser(uuid: string, request: UserUpdateRequest): Observable<User> {
    return this.http.put<User>(`${this.api}/${uuid}`, request);
  }

  deleteUser(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${uuid}`);
  }

  // ========================================
  // STATUS MANAGEMENT
  // ========================================

  toggleUserStatus(uuid: string): Observable<User> {
    return this.http.patch<User>(`${this.api}/${uuid}/toggle-status`, {});
  }
  // ========================================
  // SEARCH & FILTERS
  // ========================================

  searchUsers(keyword: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/search`, { params: { keyword } });
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/role/${role}`);
  }

  getActiveUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/active`);
  }
}
