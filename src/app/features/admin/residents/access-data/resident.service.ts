// src/app/features/admin/residents/access-data/resident.service.ts

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resident, ResidentCreateRequest, ResidentUpdateRequest } from './resident.model';
import { environment } from '../../../../../environements/environement';

@Injectable({ providedIn: 'root' })
export class ResidentService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.baseUrl}/residents`;

  getResidents(filters?: {
    unitUuid?: string;
    buildingUuid?: string;
    residenceUuid?: string;
    isOwner?: boolean;
    isPrimaryResident?: boolean;
    active?: boolean
  }): Observable<Resident[]> {
    let params: any = {};

    if (filters?.unitUuid) params.unitUuid = filters.unitUuid;
    if (filters?.buildingUuid) params.buildingUuid = filters.buildingUuid;
    if (filters?.residenceUuid) params.residenceUuid = filters.residenceUuid;
    if (filters?.isOwner !== undefined) params.isOwner = filters.isOwner;
    if (filters?.isPrimaryResident !== undefined) params.isPrimaryResident = filters.isPrimaryResident;
    if (filters?.active !== undefined) params.active = filters.active;

    return this.http.get<Resident[]>(this.api, { params });
  }

  getResidentByUuid(uuid: string): Observable<Resident> {
    return this.http.get<Resident>(`${this.api}/${uuid}`);
  }

  getResidentsByUnit(unitUuid: string): Observable<Resident[]> {
    return this.http.get<Resident[]>(`${this.api}/unit/${unitUuid}`);
  }

  getResidentsByBuilding(buildingUuid: string): Observable<Resident[]> {
    return this.http.get<Resident[]>(`${this.api}/building/${buildingUuid}`);
  }

  getResidentsByResidence(residenceUuid: string): Observable<Resident[]> {
    return this.http.get<Resident[]>(`${this.api}/residence/${residenceUuid}`);
  }

  getResidentByUser(userUuid: string): Observable<Resident> {
    return this.http.get<Resident>(`${this.api}/user/${userUuid}`);
  }

  createResident(request: ResidentCreateRequest): Observable<Resident> {
    return this.http.post<Resident>(this.api, request);
  }

  updateResident(uuid: string, request: ResidentUpdateRequest): Observable<Resident> {
    return this.http.put<Resident>(`${this.api}/${uuid}`, request);
  }

  deleteResident(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${uuid}`);
  }

  toggleResidentStatus(uuid: string): Observable<Resident> {
    return this.http.patch<Resident>(`${this.api}/${uuid}/toggle-status`, {});
  }

  searchResidents(keyword: string): Observable<Resident[]> {
    return this.http.get<Resident[]>(`${this.api}/search`, { params: { keyword } });
  }

  getActiveResidents(): Observable<Resident[]> {
    return this.http.get<Resident[]>(`${this.api}/active`);
  }

  getOwners(): Observable<Resident[]> {
    return this.http.get<Resident[]>(`${this.api}/owners`);
  }

  getPrimaryResidents(): Observable<Resident[]> {
    return this.http.get<Resident[]>(`${this.api}/primary`);
  }

  countResidentsByUnit(unitUuid: string): Observable<number> {
    return this.http.get<number>(`${this.api}/unit/${unitUuid}/count`);
  }

  countResidentsByBuilding(buildingUuid: string): Observable<number> {
    return this.http.get<number>(`${this.api}/building/${buildingUuid}/count`);
  }

  countResidentsByResidence(residenceUuid: string): Observable<number> {
    return this.http.get<number>(`${this.api}/residence/${residenceUuid}/count`);
  }

  countOwners(): Observable<number> {
    return this.http.get<number>(`${this.api}/owners/count`);
  }
}
