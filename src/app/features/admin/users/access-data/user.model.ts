// src/app/core/models/user.model.ts


import {Role} from '../../../../core/auth/models/auth.model';

export interface User {
  uuid: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  isAccountNonLocked: boolean;
  isAccountNonExpired: boolean;
  isCredentialsNonExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

export interface UserCreateRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  isActive?: boolean;
}

export interface UserUpdateRequest {
  fullName: string;
  email: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
  isAccountNonLocked?: boolean;
  isAccountNonExpired?: boolean;
  isCredentialsNonExpired?: boolean;
}

export interface UserFilters {
  keyword?: string;
  role?: Role;
  status?: 'active' | 'inactive' | 'locked' | 'all';
}
