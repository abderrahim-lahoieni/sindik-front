import { Routes } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

export const SYNDIK_ROUTES: Routes = [
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
        path: 'units',
        loadComponent: () =>
          import('./syndic-units/syndic-units.component').then(m => m.SyndicUnitsComponent)
      },
      {
        path: 'residents',
        loadComponent: () =>
          import('./residents/syndic-residents.component').then(m => m.SyndicResidentsComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/syndic-dashboard.component').then(m => m.SyndicDashboardComponent)
      },
      {
        path: 'contracts',
        children: [
          {
            path: '',
            loadComponent: () => import('./contracts/contracts.component')
              .then(m => m.SyndicContractsComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('./contracts/pages/contract-form-page.component')
              .then(m => m.ContractFormPageComponent)
          },
          {
            path: 'edit/:uuid',
            loadComponent: () => import('./contracts/pages/contract-form-page.component')
              .then(m => m.ContractFormPageComponent)
          },
          {
            path: 'view/:uuid',
            loadComponent: () => import('./contracts/pages/view/view-contract-page.component')
              .then(m => m.ViewContractPageComponent)
          }
        ]
      },
      {
        path: 'contracts/edit/:uuid',
        loadComponent: () =>
          import('./contracts/modals/edit-contract.component').then(m => m.EditContractModalComponent)
      },
      {
        path: 'payments/:contractUuid',
        loadComponent: () =>
          import('./payments/payments.component').then(m => m.SyndicPaymentsComponent)
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./payments/payments.component').then(m => m.SyndicPaymentsComponent)
      },

    ]
  }
];
