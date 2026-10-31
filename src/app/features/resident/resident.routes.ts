import { Routes } from '@angular/router';

export const RESIDENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./resident-home.component').then(m => m.ResidentHomeComponent)
  }
];
