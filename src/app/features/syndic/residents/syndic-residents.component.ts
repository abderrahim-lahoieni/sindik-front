// src/app/features/syndic/residents/syndic-residents.component.ts

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { Resident, ResidentFilters } from '../../admin/residents/access-data/resident.model';
import { ResidentService } from '../../admin/residents/access-data/resident.service';
import { SyndicBuildingService } from '../access-data/syndic-building.service';
import { UnitService } from '../../admin/units/access-data/unit.service';
import { CreateResidentModalComponent } from '../../admin/residents/modals/create-resident.component';
import { EditResidentModalComponent } from '../../admin/residents/modals/edit-resident.component';
import { TableAction, TableColumn, TableComponent } from '../../components/ui/tables/table.component';
import { ButtonComponent } from '../../components/ui/buttons/button.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ModalService } from '../../components/ui/modals/modal.service';
import ToastService from '../../components/ui/toast/toast.service';
import { CreateResidentSyndicModalComponent } from './modals/create-resident-syndic.component';
import { EditResidentSyndicModalComponent } from './modals/edit-resident-syndic.component';
import { CardConfig, CardGridComponent } from '../../components/ui/cards/card-grid.component';
import { MatIcon } from "@angular/material/icon";
import { ViewResidentSyndicModalComponent } from './modals/view-resident-syndic.component';

@Component({
  selector: 'app-syndic-residents',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableComponent,
    ButtonComponent,
    MatIcon,
    CardGridComponent
  ],
  templateUrl: './syndic-residents.component.html',

  styleUrls: ['./syndic-residents.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SyndicResidentsComponent implements OnInit {
  private readonly residentService = inject(ResidentService);
  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly unitService = inject(UnitService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  residents = signal<Resident[]>([]);
  loading = signal(true);
  selectedResidents = signal<Resident[]>([]);
  buildingOptions = signal<{ value: string; label: string }[]>([]);
  unitOptions = signal<{ value: string; label: string }[]>([
  { value: '', label: 'Toutes les unités' }
]);
  searchForm = this.fb.group({
    buildingUuid: [''],
    unitUuid: [''],
    ownerType: ['']
  });

  private readonly refreshSubject = new Subject<void>();
  private readonly searchSubject = new Subject<ResidentFilters>();
  viewMode = signal<'table' | 'cards'>('cards'); // AJOUTER
  // AJOUTER la configuration des cartes
  cardConfig: CardConfig = {
    titleKey: 'fullName',
    subtitleKey: 'phoneNumber',
    fields: [
      {
        key: 'buildingName',
        label: 'Bâtiment',
        icon: 'domain',
        type: 'badge',
        badgeClass: () => 'badge-building'
      },
      {
        key: 'unitNumber',
        label: 'Unité',
        icon: 'meeting_room',
        type: 'badge',
        badgeClass: () => 'badge-unit'
      },
      {
        key: 'isOwner',
        label: 'Type',
        icon: 'person',
        type: 'badge',
        format: (value: boolean) => value ? 'Propriétaire' : 'Locataire',
        badgeClass: (value: boolean) => value ? 'badge-owner' : 'badge-tenant'
      },
      {
        key: 'isPrimaryResident',
        label: 'Statut',
        icon: 'star',
        type: 'badge',
        format: (value: boolean) => value ? 'Principal' : 'Secondaire',
        badgeClass: (value: boolean) => value ? 'badge-primary' : 'badge-secondary'
      },
      {
        key: 'moveInDate',
        label: 'Date d\'entrée',
        icon: 'event',
        type: 'date'
      },
      {
        key: 'moveOutDate',
        label: 'Date de sortie',
        icon: 'event',
        type: 'date'
      },
      {
        key: 'emergencyPhone',
        label: 'Contact urgence',
        icon: 'phone',
        format: (value: string) => value || '-'
      }
    ],
    actions: [
      {
        icon: 'visibility',
        label: 'Voir détails',
        callback: (row: Resident) => this.viewDetails(row)
      },
      {
        icon: 'edit',
        label: 'Modifier',
        callback: (row: Resident) => this.editResident(row)
      },
      {
        icon: 'delete',
        label: 'Supprimer',
        callback: (row: Resident) => this.deleteResident(row),
      }
    ]
  };

  // AJOUTER la méthode toggle
  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'table' ? 'cards' : 'table');
  }

  columns: TableColumn[] = [
    {
      key: 'fullName',
      label: 'Nom complet',
      sortable: true,
      width: '200px'
    },
    {
      key: 'phoneNumber',
      label: 'Téléphone',
      sortable: false,
      width: '140px'
    },
    {
      key: 'buildingName',
      label: 'Bâtiment',
      sortable: true,
      width: '150px',
      format: (value: string) => `<span class="badge badge-building">${value}</span>`
    },
    {
      key: 'unitNumber',
      label: 'Unité',
      sortable: true,
      width: '100px',
      format: (value: string) => `<span class="badge badge-unit">${value}</span>`
    },
    {
      key: 'isOwner',
      label: 'Type',
      width: '120px',
      align: 'center',
      format: (value: boolean) => value
        ? '<span class="badge badge-owner">Propriétaire</span>'
        : '<span class="badge badge-tenant">Locataire</span>'
    },
    {
      key: 'isPrimaryResident',
      label: 'Principal',
      width: '100px',
      align: 'center',
      format: (value: boolean) => value
        ? '<span class="badge badge-primary">Oui</span>'
        : '<span class="badge badge-secondary">Non</span>'
    },
    {
      key: 'moveInDate',
      label: 'Date d\'entrée',
      sortable: true,
      width: '120px',
      format: (value: Date) => value ? new Date(value).toLocaleDateString('fr-FR') : '-'
    },
    {
      key: 'moveOutDate',
      label: 'Date de sortie',
      sortable: true,
      width: '120px',
      format: (value: Date) => value ? new Date(value).toLocaleDateString('fr-FR') : '-'
    },
    {
      key: 'emergencyPhone',
      label: 'Contact urgence',
      width: '140px',
      format: (value: string) => value || '-'
    }
  ];

  actions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'Voir détails',
      callback: (row: Resident) => this.viewDetails(row)
    },
    {
      icon: 'edit',
      label: 'Modifier',
      callback: (row: Resident) => this.editResident(row)
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      callback: (row: Resident) => this.deleteResident(row),
    }
  ];

  deleteResident(resident: Resident): void {
    this.modal.confirmDelete(resident.fullName).subscribe((confirmed) => {
      if (confirmed) {
        this.residentService.deleteResident(resident.uuid).subscribe({
          next: () => {
            this.toast.delete('Résident supprimé avec succès');
            this.loadResidents();
          },
          error: () => this.toast.error('Erreur lors de la suppression')
        });
      }
    });
  }

  ownerTypeOptions = [
    { value: '', label: 'Tous' },
    { value: 'owner', label: 'Propriétaires' },
    { value: 'tenant', label: 'Locataires' },
    { value: 'primary', label: 'Résidents principaux' }
  ];

  ngOnInit(): void {
    this.loadMyBuildings();
    this.setupSearch();
    this.setupBuildingWatcher();

    // Charger avec filtre si présent dans l'URL
    this.route.queryParams.subscribe(params => {
      if (params['buildingUuid']) {
        this.searchForm.patchValue({ buildingUuid: params['buildingUuid'] });
      } else {
        this.loadResidents();
      }
    });
  }

  private loadMyBuildings(): void {
    const currentUserUuid = this.auth.getUsernameUUid();
    if (!currentUserUuid) return;

    this.syndicBuildingService.getBuildingsBySyndic(currentUserUuid).subscribe({
      next: (buildings) => {
        const options = [
          { value: '', label: 'Tous mes bâtiments' },
          ...buildings.map(b => ({ value: b.buildingUuid, label: b.buildingName }))
        ];
        this.buildingOptions.set(options);
      }
    });
  }

  private setupBuildingWatcher(): void {
    this.searchForm.get('buildingUuid')?.valueChanges.subscribe(buildingUuid => {
      if (buildingUuid) {
        this.unitService.getUnits({ buildingUuid, active: true }).subscribe({
          next: (units) => {
            const options = [
              { value: '', label: 'Toutes les unités' },
              ...units.map(u => ({ value: u.uuid, label: u.unitNumber }))
            ];
            this.unitOptions.set(options);
            this.searchForm.get('unitUuid')?.setValue('');
          }
        });
      } else {
        this.unitOptions.set([{ value: '', label: 'Toutes les unités' }]);
      }
    });
  }

  private setupSearch(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(filters => {
        const ownerType = filters.ownerType;
        this.searchSubject.next({
          buildingUuid: filters.buildingUuid || undefined,
          unitUuid: filters.unitUuid || undefined,
          isOwner: ownerType === 'owner' ? true : ownerType === 'tenant' ? false : undefined,
          isPrimaryResident: ownerType === 'primary' ? true : undefined
        });
      });

    merge(
      this.searchSubject.pipe(
        tap(() => this.loading.set(true)),
        switchMap(filters => this.fetchResidents(filters))
      ),
      this.refreshSubject.pipe(
        tap(() => this.loading.set(true)),
        switchMap(() => this.fetchResidents())
      )
    ).subscribe({
      next: (residents) => {
        this.residents.set(residents);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des résidents');
        this.loading.set(false);
      }
    });
  }

  private fetchResidents(filters?: ResidentFilters) {
    // Le backend filtre automatiquement par le syndic connecté
    return this.residentService.getResidents({
      buildingUuid: filters?.buildingUuid,
      unitUuid: filters?.unitUuid,
      isOwner: filters?.isOwner,
      isPrimaryResident: filters?.isPrimaryResident
    });
  }

  loadResidents(): void {
    this.refreshSubject.next();
  }

  openCreateModal(): void {
    this.modal.open(CreateResidentSyndicModalComponent, {
      width: '900px',
      data: { mode: 'create' }
    }).afterClosed().subscribe((result: Resident) => {
      if (result) {
        this.loadResidents();
      }
    });
  }

  editResident(resident: Resident): void {
    this.modal.open(EditResidentSyndicModalComponent, {
      width: '900px',
      data: { resident, mode: 'edit' }
    }).afterClosed().subscribe((result: Resident) => {
      if (result) {
        this.loadResidents();
        this.toast.success('Résident modifié avec succès');
      }
    });
  }

  viewDetails(resident: Resident): void {
    this.modal.open(ViewResidentSyndicModalComponent, {
      width: '800px',
      data: { resident }
    });
  }
  onRowClick(resident: Resident): void {
    this.viewDetails(resident);
  }

  onSelectionChange(selectedRows: Resident[]): void {
    this.selectedResidents.set(selectedRows);
  }

  resetFilters(): void {
  this.searchForm.reset({
    buildingUuid: '',
    unitUuid: '',
    ownerType: ''
  });
}
}
