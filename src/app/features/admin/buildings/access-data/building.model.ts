// src/app/features/admin/buildings/access-data/building.model.ts

export interface Building {
  uuid: string;
  name: string;
  address: string;
  numberOfFloors: number;
  numberOfUnits: number;
  description: string;
  isActive: boolean;
  residenceUuid: string;
  residenceName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuildingCreateRequest {
  name: string;
  address: string;
  residenceUuid: string;
  numberOfFloors: number;
  numberOfUnits: number;
  description?: string;
  isActive?: boolean;
}

export interface BuildingUpdateRequest {
  name: string;
  address: string;
  residenceUuid?: string;
  numberOfFloors?: number;
  numberOfUnits?: number;
  description?: string;
  isActive?: boolean;
}

export interface BuildingFilters {
  keyword?: string;
  residenceUuid?: string;
  status?: 'active' | 'inactive' | 'all';
}
