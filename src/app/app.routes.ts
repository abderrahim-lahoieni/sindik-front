import { Routes } from '@angular/router';
import {authGuard} from './core/auth/auth.guard';
import {Role} from './core/auth/models/auth.model';
import { RoleRedirectComponent } from '../role-redirect.component';
export const routes: Routes = [
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./core/auth/access-denied.component').then(m => m.AccessDeniedComponent)
  },
   {
    path: '',
    component: RoleRedirectComponent
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: [Role.A] },
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'syndik',
    canActivate: [authGuard],
    data: { roles: [Role.S] },
    loadChildren: () =>
      import('./features/syndic/sindik.routes').then(m => m.SYNDIK_ROUTES)
  },
  {
    path: 'resident',
    canActivate: [authGuard],
    data: { roles: [Role.R] },
    loadChildren: () =>
      import('./features/syndic/sindik.routes').then(m => m.SYNDIK_ROUTES)
  },
  // 🔹 Correction ici
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
