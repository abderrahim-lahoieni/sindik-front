// src/app/features/admin/residents/access-data/resident.model.ts

export interface Resident {
  uuid: string;
  fullName: string;
  phoneNumber: string;
  emergencyContact: string;
  emergencyPhone: string;
  moveInDate: Date;
  moveOutDate: Date;
  isOwner: boolean;
  isPrimaryResident: boolean;
  notes: string;
  isActive: boolean;
  userUuid: string;
  userEmail: string;
  unitUuid: string;
  unitNumber: string;
  buildingUuid: string;
  buildingName: string;
  residenceUuid: string;
  residenceName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResidentCreateRequest {
  fullName: string;
  phoneNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  unitUuid: string;
  userUuid?: string;
  moveInDate?: Date;
  moveOutDate?: Date;
  isOwner?: boolean;
  isPrimaryResident?: boolean;
  notes?: string;
  isActive?: boolean;
}

export interface ResidentUpdateRequest {
  fullName: string;
  phoneNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  unitUuid?: string;
  userUuid?: string;
  moveInDate?: Date;
  moveOutDate?: Date;
  isOwner?: boolean;
  isPrimaryResident?: boolean;
  notes?: string;
  isActive?: boolean;
}

export interface ResidentFilters {
  keyword?: string;
  unitUuid?: string;
  buildingUuid?: string;
  residenceUuid?: string;
  isOwner?: boolean;
  isPrimaryResident?: boolean;
  status?: 'active' | 'inactive' | 'all';
}
