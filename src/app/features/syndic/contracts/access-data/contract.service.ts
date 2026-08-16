// src/app/features/syndic/contracts/access-data/contract.service.ts

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environements/environement';
import {
  Contract,
  ContractCreateRequest,
  ContractUpdateRequest,
  ContractFilters
} from './contract.model';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.baseUrl}/contracts`;

  getContracts(filters?: ContractFilters): Observable<Contract[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.residentUuid) params = params.set('residentUuid', filters.residentUuid);
      if (filters.unitUuid) params = params.set('unitUuid', filters.unitUuid);
      if (filters.buildingUuid) params = params.set('buildingUuid', filters.buildingUuid);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.isActive !== undefined) params = params.set('isActive', String(filters.isActive));
    }

    return this.http.get<Contract[]>(this.api, { params });
  }

  getContractByUuid(uuid: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.api}/${uuid}`);
  }

  createContract(request: ContractCreateRequest): Observable<Contract> {
    return this.http.post<Contract>(this.api, request);
  }

  updateContract(uuid: string, request: ContractUpdateRequest): Observable<Contract> {
    return this.http.put<Contract>(`${this.api}/${uuid}`, request);
  }

  deleteContract(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${uuid}`);
  }

  getContractsByBuilding(buildingUuid: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.api}/building/${buildingUuid}`);
  }

  getContractsByResident(residentUuid: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.api}/resident/${residentUuid}`);
  }

  getExpiringContracts(daysAhead: number = 30): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.api}/expiring`, {
      params: { daysAhead: String(daysAhead) }
    });
  }

  // src/app/features/syndic/contracts/access-data/contract.service.ts

// Ajouter ces méthodes dans le ContractService existant:

downloadContractPdf(uuid: string): Observable<Blob> {
  return this.http.get(`${this.api}/${uuid}/download-pdf`, {
    responseType: 'blob'
  });
}

previewContractPdf(uuid: string): Observable<Blob> {
  return this.http.get(`${this.api}/${uuid}/preview-pdf`, {
    responseType: 'blob'
  });
}
}