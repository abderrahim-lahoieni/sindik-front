import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environements/environement';

export interface ResidentHomeSummary {
  fullName: string;
  phoneNumber?: string;
  moveInDate?: string;
  isOwner?: boolean;
  isPrimaryResident?: boolean;
  isActive?: boolean;
  unitNumber?: string;
  buildingName?: string;
  residenceName?: string;
}

@Injectable({ providedIn: 'root' })
export class ResidentPortalService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.baseUrl}/residents`;

  getMyHome(): Observable<ResidentHomeSummary> {
    return this.http.get<ResidentHomeSummary>(`${this.api}/me`);
  }
}
