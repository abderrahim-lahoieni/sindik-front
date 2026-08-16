// src/app/features/admin/units/access-data/unit.service.ts

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Unit, UnitCreateRequest, UnitUpdateRequest } from './unit.model';
import { environment } from '../../../../../environements/environement';

@Injectable({ providedIn: 'root' })
export class UnitService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.baseUrl}/units`;

  getUnits(filters?: {
    buildingUuid?: string;
    residenceUuid?: string;
    type?: string;
    occupied?: boolean;
    active?: boolean
  }): Observable<Unit[]> {
    let params: any = {};

    if (filters?.buildingUuid) params.buildingUuid = filters.buildingUuid;
    if (filters?.residenceUuid) params.residenceUuid = filters.residenceUuid;
    if (filters?.type) params.type = filters.type;
    if (filters?.occupied !== undefined) params.occupied = filters.occupied;
    if (filters?.active !== undefined) params.active = filters.active;

    return this.http.get<Unit[]>(this.api, { params });
  }

  getUnitByUuid(uuid: string): Observable<Unit> {
    return this.http.get<Unit>(`${this.api}/${uuid}`);
  }

  getUnitsByBuilding(buildingUuid: string): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.api}/building/${buildingUuid}`);
  }

  getUnitsByResidence(residenceUuid: string): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.api}/residence/${residenceUuid}`);
  }

  createUnit(request: UnitCreateRequest): Observable<Unit> {
    return this.http.post<Unit>(this.api, request);
  }

  updateUnit(uuid: string, request: UnitUpdateRequest): Observable<Unit> {
    return this.http.put<Unit>(`${this.api}/${uuid}`, request);
  }

  deleteUnit(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${uuid}`);
  }

  toggleUnitStatus(uuid: string): Observable<Unit> {
    return this.http.patch<Unit>(`${this.api}/${uuid}/toggle-status`, {});
  }

  toggleUnitOccupancy(uuid: string): Observable<Unit> {
    return this.http.patch<Unit>(`${this.api}/${uuid}/toggle-occupancy`, {});
  }

  searchUnits(keyword: string): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.api}/search`, { params: { keyword } });
  }

  getActiveUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.api}/active`);
  }

  getAvailableUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.api}/available`);
  }

  getOccupiedUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.api}/occupied`);
  }

  getUnitsByType(type: string): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.api}/type/${type}`);
  }

  countUnitsByBuilding(buildingUuid: string): Observable<number> {
    return this.http.get<number>(`${this.api}/building/${buildingUuid}/count`);
  }

  countAvailableUnitsByBuilding(buildingUuid: string): Observable<number> {
    return this.http.get<number>(`${this.api}/building/${buildingUuid}/count-available`);
  }
}
