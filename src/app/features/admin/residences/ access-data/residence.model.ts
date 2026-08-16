// src/app/features/admin/residences/access-data/residence.model.ts

export enum ResidenceType {
  APARTMENT_BUILDING = 'APARTMENT_BUILDING',
  TOWNHOUSE_COMPLEX = 'TOWNHOUSE_COMPLEX',
  CONDOMINIUM = 'CONDOMINIUM',
  GATED_COMMUNITY = 'GATED_COMMUNITY',
  MIXED_USE = 'MIXED_USE'
}

export interface Residence {
  uuid: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  type: ResidenceType;
  numberOfBuildings: number;
  numberOfUnits: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResidenceCreateRequest {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  type: ResidenceType;
  numberOfBuildings: number;
  numberOfUnits: number;
  description?: string;
  isActive?: boolean;
}

export interface ResidenceUpdateRequest {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  type?: ResidenceType;
  numberOfBuildings?: number;
  numberOfUnits?: number;
  description?: string;
  isActive?: boolean;
}

export interface ResidenceFilters {
  keyword?: string;
  type?: ResidenceType;
  status?: 'active' | 'inactive' | 'all';
}
