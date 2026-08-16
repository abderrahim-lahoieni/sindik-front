// src/app/features/syndic/payments/access-data/payment.model.ts

export enum PaymentType {
  RENT = 'RENT',
  DEPOSIT = 'DEPOSIT',
  MAINTENANCE_FEE = 'MAINTENANCE_FEE',
  UTILITY = 'UTILITY',
  PARKING = 'PARKING',
  LATE_FEE = 'LATE_FEE',
  OTHER = 'OTHER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  OTHER = 'OTHER'
}

export interface Payment {
  uuid: string;
  contractUuid: string;
  contractNumber: string;
  residentUuid: string;
  residentName: string;
  unitUuid: string;
  unitNumber: string;
  buildingUuid: string;
  buildingName: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: number;
  amountPaid: number;
  remainingAmount: number;
  dueDate: Date;
  paymentDate?: Date;
  paymentMethod?: PaymentMethod;
  paymentReference: string;
  periodStart?: Date;
  periodEnd?: Date;
  lateFee: number;
  discount: number;
  notes?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  isLate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentCreateRequest {
  contractUuid: string;
  residentUuid: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: number;
  amountPaid?: number;
  dueDate: Date;
  paymentDate?: Date;
  paymentMethod?: PaymentMethod;
  periodStart?: Date;
  periodEnd?: Date;
  lateFee?: number;
  discount?: number;
  notes?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
}

export interface PaymentUpdateRequest {
  type?: PaymentType;
  status?: PaymentStatus;
  amount?: number;
  amountPaid?: number;
  dueDate?: Date;
  paymentDate?: Date;
  paymentMethod?: PaymentMethod;
  periodStart?: Date;
  periodEnd?: Date;
  lateFee?: number;
  discount?: number;
  notes?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
}

export interface PaymentFilters {
  contractUuid?: string;
  residentUuid?: string;
  buildingUuid?: string;
  type?: PaymentType;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface RecordPaymentRequest {
  amount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  receiptUrl?: string;
}