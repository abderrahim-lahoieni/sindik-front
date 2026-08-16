// src/app/features/admin/buildings/access-data/building.service.ts

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Building, BuildingCreateRequest, BuildingUpdateRequest } from './building.model';
import { environment } from '../../../../../environements/environement';

@Injectable({ providedIn: 'root' })
export class BuildingService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.baseUrl}/buildings`;

  getBuildings(filters?: { residenceUuid?: string; active?: boolean }): Observable<Building[]> {
    let params: any = {};

    if (filters?.residenceUuid) params.residenceUuid = filters.residenceUuid;
    if (filters?.active !== undefined) params.active = filters.active;

    return this.http.get<Building[]>(this.api, { params });
  }

  getBuildingByUuid(uuid: string): Observable<Building> {
    return this.http.get<Building>(`${this.api}/${uuid}`);
  }

  getBuildingsByResidence(residenceUuid: string): Observable<Building[]> {
    return this.http.get<Building[]>(`${this.api}/residence/${residenceUuid}`);
  }

  createBuilding(request: BuildingCreateRequest): Observable<Building> {
    return this.http.post<Building>(this.api, request);
  }

  updateBuilding(uuid: string, request: BuildingUpdateRequest): Observable<Building> {
    return this.http.put<Building>(`${this.api}/${uuid}`, request);
  }

  deleteBuilding(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${uuid}`);
  }

  toggleBuildingStatus(uuid: string): Observable<Building> {
    return this.http.patch<Building>(`${this.api}/${uuid}/toggle-status`, {});
  }

  searchBuildings(keyword: string): Observable<Building[]> {
    return this.http.get<Building[]>(`${this.api}/search`, { params: { keyword } });
  }

  getActiveBuildings(): Observable<Building[]> {
    return this.http.get<Building[]>(`${this.api}/active`);
  }

  countBuildingsByResidence(residenceUuid: string): Observable<number> {
    return this.http.get<number>(`${this.api}/residence/${residenceUuid}/count`);
  }
}
