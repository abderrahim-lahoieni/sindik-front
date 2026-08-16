// src/app/features/admin/residents/residents.component.ts

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { Resident, ResidentFilters } from './access-data/resident.model';
import { ResidentService } from './access-data/resident.service';
import { UnitService } from '../units/access-data/unit.service';
import { BuildingService } from '../buildings/access-data/building.service';
import {ResidenceService} from '../residences/ access-data/residence.service';
import {TableAction, TableColumn, TableComponent} from '../../components/ui/tables/table.component';
import {ButtonComponent} from '../../components/ui/buttons/button.component';
import {ModalService} from '../../components/ui/modals/modal.service';
import ToastService from '../../components/ui/toast/toast.service';
import {AuthService} from '../../../core/auth/auth.service';
import {Role} from '../../../core/auth/models/auth.model';
import {EditResidentModalComponent} from './modals/edit-resident.component';
import {CreateResidentModalComponent} from './modals/create-resident.component';


@Component({
  selector: 'app-resident-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableComponent,
    ButtonComponent
  ],
  templateUrl: './residents.component.html',
  styleUrls: ['./residents.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResidentsComponent implements OnInit {
  private readonly residentService = inject(ResidentService);
  private readonly unitService = inject(UnitService);
  private readonly buildingService = inject(BuildingService);
  private readonly residenceService = inject(ResidenceService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  residents = signal<Resident[]>([]);
  loading = signal(true);
  selectedResidents = signal<Resident[]>([]);
  currentRole = signal<Role | null>(this.auth.getRole());
  unitOptions = signal<{ value: string; label: string }[]>([]);
  buildingOptions = signal<{ value: string; label: string }[]>([]);
  residenceOptions = signal<{ value: string; label: string }[]>([]);

  searchForm = this.fb.group({
    keyword: [''],
    residenceUuid: [''],
    buildingUuid: [''],
    unitUuid: [''],
    ownerType: [''],
    status: ['']
  });

  private readonly refreshSubject = new Subject<void>();
  private readonly searchSubject = new Subject<ResidentFilters>();

  columns: TableColumn[] = [
    { key: 'fullName', label: 'Nom complet', sortable: true, width: '200px' },
    { key: 'phoneNumber', label: 'Téléphone', sortable: false, width: '140px' },
    {
      key: 'residenceName',
      label: 'Résidence',
      sortable: true,
      width: '160px',
      format: (value: string) => `<span class="badge badge-residence">${value}</span>`
    },
    {
      key: 'buildingName',
      label: 'Bâtiment',
      sortable: true,
      width: '130px',
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
      label: 'Propriétaire',
      width: '120px',
      align: 'center',
      format: (value: boolean) => value
        ? '<span class="badge badge-owner">Oui</span>'
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
      key: 'isActive',
      label: 'Statut',
      width: '100px',
      align: 'center',
      format: (value: boolean) => value
        ? '<span class="badge badge-success">Actif</span>'
        : '<span class="badge badge-danger">Inactif</span>'
    }
  ];

  actions: TableAction[] = [
    {
      icon: this.getStatusIcon(),
      label: this.getStatusLabel(),
      callback: (row: Resident) => this.toggleResidentStatus(row),
      hidden: () => !this.isAdmin()
    },
    {
      icon: 'edit',
      label: 'Modifier',
      callback: (row: Resident) => this.editResident(row),
      hidden: () => !this.isAdmin()
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      callback: (row: Resident) => this.deleteResident(row),
      hidden: () => !this.isAdmin()
    }
  ];

  ownerTypeOptions = [
    { value: '', label: 'Tous' },
    { value: 'owner', label: 'Propriétaires' },
    { value: 'tenant', label: 'Locataires' },
    { value: 'primary', label: 'Résidents principaux' }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ];

  ngOnInit(): void {
    this.loadResidences();
    this.loadBuildings();
    this.loadUnits();
    this.setupSearch();
    this.loadResidents();
    this.setupCascadeFilters();
  }

  private loadResidences(): void {
    this.residenceService.getResidences().subscribe({
      next: (residences) => {
        const options = [
          { value: '', label: 'Toutes les résidences' },
          ...residences.map(r => ({ value: r.uuid, label: r.name }))
        ];
        this.residenceOptions.set(options);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des résidences');
      }
    });
  }

  private loadBuildings(): void {
    this.buildingService.getBuildings().subscribe({
      next: (buildings) => {
        const options = [
          { value: '', label: 'Tous les bâtiments' },
          ...buildings.map(b => ({ value: b.uuid, label: `${b.residenceName} - ${b.name}` }))
        ];
        this.buildingOptions.set(options);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des bâtiments');
      }
    });
  }

  private loadUnits(): void {
    this.unitService.getUnits().subscribe({
      next: (units) => {
        const options = [
          { value: '', label: 'Toutes les unités' },
          ...units.map(u => ({ value: u.uuid, label: `${u.residenceName} - ${u.buildingName} - ${u.unitNumber}` }))
        ];
        this.unitOptions.set(options);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des unités');
      }
    });
  }

  private setupCascadeFilters(): void {
    // Quand résidence change, filtrer les bâtiments
    this.searchForm.get('residenceUuid')?.valueChanges.subscribe(residenceUuid => {
      if (residenceUuid) {
        this.buildingService.getBuildings({ residenceUuid, active: true }).subscribe({
          next: (buildings) => {
            const options = [
              { value: '', label: 'Tous les bâtiments' },
              ...buildings.map(b => ({ value: b.uuid, label: b.name }))
            ];
            this.buildingOptions.set(options);
            this.searchForm.get('buildingUuid')?.setValue('');
            this.searchForm.get('unitUuid')?.setValue('');
          }
        });
      } else {
        this.loadBuildings();
      }
    });

    // Quand bâtiment change, filtrer les unités
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
      } else if (this.searchForm.get('residenceUuid')?.value) {
        const residenceUuid = this.searchForm.get('residenceUuid')?.value ?? undefined;        this.unitService.getUnits({ residenceUuid, active: true }).subscribe({
          next: (units) => {
            const options = [
              { value: '', label: 'Toutes les unités' },
              ...units.map(u => ({ value: u.uuid, label: `${u.buildingName} - ${u.unitNumber}` }))
            ];
            this.unitOptions.set(options);
          }
        });
      } else {
        this.loadUnits();
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
          keyword: filters.keyword || undefined,
          residenceUuid: filters.residenceUuid || undefined,
          buildingUuid: filters.buildingUuid || undefined,
          unitUuid: filters.unitUuid || undefined,
          isOwner: ownerType === 'owner' ? true : ownerType === 'tenant' ? false : undefined,
          isPrimaryResident: ownerType === 'primary' ? true : undefined,
          status: filters.status as any || undefined
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
    return this.residentService.getResidents({
      unitUuid: filters?.unitUuid,
      buildingUuid: filters?.buildingUuid,
      residenceUuid: filters?.residenceUuid,
      isOwner: filters?.isOwner,
      isPrimaryResident: filters?.isPrimaryResident,
      active:
        filters?.status === 'active'
          ? true
          : filters?.status === 'inactive'
            ? false
            : undefined
    });
  }

  loadResidents(): void {
    this.refreshSubject.next();
  }

  openCreateModal(): void {
    this.modal.open(CreateResidentModalComponent, {
      width: '900px',
      data: { mode: 'create' }
    }).afterClosed().subscribe((result: Resident) => {
      if (result) {
        this.loadResidents();
      }
    });
  }

  editResident(resident: Resident): void {
    this.modal.open(EditResidentModalComponent, {
      width: '900px',
      data: { resident, mode: 'edit' }
    }).afterClosed().subscribe((result: Resident) => {
      if (result) {
        this.loadResidents();
        this.toast.success('Résident modifié avec succès');
      }
    });
  }

  toggleResidentStatus(resident: Resident): void {
    const action = resident.isActive ? 'désactiver' : 'activer';
    this.modal.confirm({
      title: 'Confirmation',
      message: `Voulez-vous ${action} le résident ${resident.fullName} ?`,
      type: 'warning',
      confirmText: 'Oui',
      cancelText: 'Non'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.residentService.toggleResidentStatus(resident.uuid).subscribe({
          next: () => {
            this.toast.success(`Résident ${action} avec succès`);
            this.loadResidents();
          },
          error: () => this.toast.error(`Erreur lors de la ${action}tion`)
        });
      }
    });
  }

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

  onSelectionChange(selectedRows: Resident[]): void {
    this.selectedResidents.set(selectedRows);
  }

  isAdmin(): boolean {
    return this.currentRole() === 'ADMIN';
  }

  private getStatusIcon(): (row: Resident) => string {
    return (row: Resident) => row.isActive ? 'toggle_off' : 'toggle_on';
  }

  private getStatusLabel(): (row: Resident) => string {
    return (row: Resident) => row.isActive ? 'Désactiver' : 'Activer';
  }
}
