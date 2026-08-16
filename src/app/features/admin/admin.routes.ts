import { Routes } from '@angular/router';
import {SidebarComponent} from '../sidebar/sidebar.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: SidebarComponent, // Layout global
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full' // obligatoire pour les routes vides
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./users/users-list/users.component').then(m => m.UserComponent)
      },
      {
        path: 'residences',
        loadComponent: () =>
          import('./residences/residences.component').then(m => m.ResidencesComponent)
      },
      {
        path: 'buildings',
        loadComponent: () =>
          import('./buildings/buildings.component').then(m => m.BuildingsComponent)
      },
      {
        path: 'units',
        loadComponent: () =>
          import('./units/units.component').then(m => m.UnitsComponent)
      },
      {
        path: 'residents',
        loadComponent: () =>
          import('./residents/residents.component').then(m => m.ResidentsComponent)
      },
    ]
  }
];
