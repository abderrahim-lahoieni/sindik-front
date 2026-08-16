// src/app/features/admin/units/access-data/unit.model.ts

export enum UnitType {
  APARTMENT = 'APARTMENT',
  STUDIO = 'STUDIO',
  DUPLEX = 'DUPLEX',
  PENTHOUSE = 'PENTHOUSE',
  COMMERCIAL = 'COMMERCIAL',
  PARKING = 'PARKING',
  STORAGE = 'STORAGE'
}

export interface Unit {
  uuid: string;
  unitNumber: string;
  type: UnitType;
  floorNumber: number;
  area: number;
  numberOfRooms: number;
  numberOfBathrooms: number;
  hasBalcony: boolean;
  hasParking: boolean;
  description: string;
  isOccupied: boolean;
  isActive: boolean;
  buildingUuid: string;
  buildingName: string;
  residenceUuid: string;
  residenceName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnitCreateRequest {
  unitNumber: string;
  buildingUuid: string;
  type: UnitType;
  floorNumber: number;
  area?: number;
  numberOfRooms?: number;
  numberOfBathrooms?: number;
  hasBalcony?: boolean;
  hasParking?: boolean;
  description?: string;
  isOccupied?: boolean;
  isActive?: boolean;
}

export interface UnitUpdateRequest {
  unitNumber: string;
  buildingUuid?: string;
  type?: UnitType;
  floorNumber?: number;
  area?: number;
  numberOfRooms?: number;
  numberOfBathrooms?: number;
  hasBalcony?: boolean;
  hasParking?: boolean;
  description?: string;
  isOccupied?: boolean;
  isActive?: boolean;
}

export interface UnitFilters {
  keyword?: string;
  buildingUuid?: string;
  residenceUuid?: string;
  type?: UnitType;
  occupied?: boolean;
  status?: 'active' | 'inactive' | 'all';
}
