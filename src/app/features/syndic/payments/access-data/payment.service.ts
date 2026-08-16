// src/app/features/syndic/payments/access-data/payment.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environements/environement';
import {
  Payment,
  PaymentCreateRequest,
  PaymentUpdateRequest,
  PaymentFilters,
  RecordPaymentRequest
} from './payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.baseUrl}/payments`;

  getPayments(filters?: PaymentFilters): Observable<Payment[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.contractUuid) params = params.set('contractUuid', filters.contractUuid);
      if (filters.residentUuid) params = params.set('residentUuid', filters.residentUuid);
      if (filters.buildingUuid) params = params.set('buildingUuid', filters.buildingUuid);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString().split('T')[0]);
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString().split('T')[0]);
    }

    return this.http.get<Payment[]>(this.api, { params });
  }

  getPaymentByUuid(uuid: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.api}/${uuid}`);
  }

  createPayment(request: PaymentCreateRequest): Observable<Payment> {
    return this.http.post<Payment>(this.api, request);
  }

  updatePayment(uuid: string, request: PaymentUpdateRequest): Observable<Payment> {
    return this.http.put<Payment>(`${this.api}/${uuid}`, request);
  }

  deletePayment(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${uuid}`);
  }

  recordPayment(uuid: string, amount: number, request: PaymentUpdateRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.api}/${uuid}/record`, request, {
      params: { amount: String(amount) }
    });
  }

  getPaymentsByContract(contractUuid: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.api}/contract/${contractUuid}`);
  }

  getPaymentsByResident(residentUuid: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.api}/resident/${residentUuid}`);
  }

  getPaymentsByBuilding(buildingUuid: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.api}/building/${buildingUuid}`);
  }

  getOverduePayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.api}/overdue`);
  }

  getUpcomingPayments(daysAhead: number = 30): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.api}/upcoming`, {
      params: { daysAhead: String(daysAhead) }
    });
  }

  getTotalPaidByBuilding(buildingUuid: string): Observable<number> {
    return this.http.get<number>(`${this.api}/building/${buildingUuid}/total-paid`);
  }

  getTotalPendingByBuilding(buildingUuid: string): Observable<number> {
    return this.http.get<number>(`${this.api}/building/${buildingUuid}/total-pending`);
  }
}