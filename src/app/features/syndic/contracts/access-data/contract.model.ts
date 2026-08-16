// src/app/features/syndic/contracts/access-data/contract.model.ts

export enum ContractType {
  RENTAL = 'RENTAL',
  OWNERSHIP = 'OWNERSHIP',
  SUBLEASE = 'SUBLEASE',
  COMMERCIAL = 'COMMERCIAL',
  PARKING = 'PARKING',
  STORAGE = 'STORAGE'
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  RENEWED = 'RENEWED'
}

export enum PaymentFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL'
}

export interface Contract {
  uuid: string;
  residentUuid: string;
  residentName: string;
  unitUuid: string;
  unitNumber: string;
  buildingUuid: string;
  buildingName: string;
  residenceUuid: string;
  residenceName: string;
  type: ContractType;
  status: ContractStatus;
  startDate: Date;
  endDate?: Date;
  monthlyRent: number;
  depositAmount?: number;
  depositPaid: boolean;
  paymentFrequency: PaymentFrequency;
  paymentDay?: number;
  contractNumber: string;
  terms?: string;
  notes?: string;
  renewalNoticeDays?: number;
  autoRenewable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractCreateRequest {
  residentUuid: string;
  unitUuid: string;
  type: ContractType;
  status: ContractStatus;
  startDate: Date;
  endDate?: Date;
  monthlyRent: number;
  depositAmount?: number;
  depositPaid?: boolean;
  paymentFrequency: PaymentFrequency;
  paymentDay?: number;
  terms?: string;
  notes?: string;
  renewalNoticeDays?: number;
  autoRenewable?: boolean;
  isActive?: boolean;
}

export interface ContractUpdateRequest {
  residentUuid?: string;
  unitUuid?: string;
  type?: ContractType;
  status?: ContractStatus;
  startDate?: Date;
  endDate?: Date;
  monthlyRent?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  paymentFrequency?: PaymentFrequency;
  paymentDay?: number;
  terms?: string;
  notes?: string;
  renewalNoticeDays?: number;
  autoRenewable?: boolean;
  isActive?: boolean;
}

export interface ContractFilters {
  residentUuid?: string;
  unitUuid?: string;
  buildingUuid?: string;
  type?: ContractType;
  status?: ContractStatus;
  isActive?: boolean;
}