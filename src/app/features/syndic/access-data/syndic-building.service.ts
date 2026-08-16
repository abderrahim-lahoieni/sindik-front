// src/app/features/syndic/access-data/syndic-building.service.ts

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environements/environement';

export interface SyndicBuilding {
  uuid: string;
  syndicUuid: string;
  syndicName: string;
  syndicEmail: string;
  buildingUuid: string;
  buildingName: string;
  residenceUuid: string;
  residenceName: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface AssignSyndicRequest {
  syndicUuid: string;
  buildingUuids: string[];
  assignedBy?: string;
}

@Injectable({ providedIn: 'root' })
export class SyndicBuildingService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.baseUrl}/syndic-buildings`;

  // ADMIN : Assigner un syndic à des bâtiments
  assignSyndicToBuildings(request: AssignSyndicRequest): Observable<SyndicBuilding[]> {
    return this.http.post<SyndicBuilding[]>(`${this.api}/assign`, request);
  }

  // Récupérer les bâtiments gérés par un syndic
  getBuildingsBySyndic(syndicUuid: string): Observable<SyndicBuilding[]> {
    return this.http.get<SyndicBuilding[]>(`${this.api}/syndic/${syndicUuid}`);
  }

  // ADMIN : Récupérer les syndics d'un bâtiment
  getSyndicsByBuilding(buildingUuid: string): Observable<SyndicBuilding[]> {
    return this.http.get<SyndicBuilding[]>(`${this.api}/building/${buildingUuid}`);
  }

  // ADMIN : Retirer un syndic d'un bâtiment
  removeSyndicFromBuilding(syndicUuid: string, buildingUuid: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/syndic/${syndicUuid}/building/${buildingUuid}`);
  }
}
