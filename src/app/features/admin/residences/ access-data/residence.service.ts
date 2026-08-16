
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Residence, ResidenceCreateRequest, ResidenceUpdateRequest } from './residence.model';
import { environment } from '../../../../../environements/environement';

@Injectable({ providedIn: 'root' })
export class ResidenceService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.baseUrl}/residences`;

  getResidences(filters?: { type?: string; active?: boolean }): Observable<Residence[]> {
    let params: any = {};

    if (filters?.type) params.type = filters.type;
    if (filters?.active !== undefined) params.active = filters.active;

    return this.http.get<Residence[]>(this.api, { params });
  }

  getResidenceByUuid(uuid: string): Observable<Residence> {
    return this.http.get<Residence>(`${this.api}/${uuid}`);
  }

  createResidence(request: ResidenceCreateRequest): Observable<Residence> {
    return this.http.post<Residence>(this.api, request);
  }

  updateResidence(uuid: string, request: ResidenceUpdateRequest): Observable<Residence> {
    return this.http.put<Residence>(`${this.api}/${uuid}`, request);
  }

  deleteResidence(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${uuid}`);
  }

  toggleResidenceStatus(uuid: string): Observable<Residence> {
    return this.http.patch<Residence>(`${this.api}/${uuid}/toggle-status`, {});
  }

  searchResidences(keyword: string): Observable<Residence[]> {
    return this.http.get<Residence[]>(`${this.api}/search`, { params: { keyword } });
  }

  getResidencesByType(type: string): Observable<Residence[]> {
    return this.http.get<Residence[]>(`${this.api}/type/${type}`);
  }

  getActiveResidences(): Observable<Residence[]> {
    return this.http.get<Residence[]>(`${this.api}/active`);
  }
}
