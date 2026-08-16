// src/app/features/admin/buildings/buildings.component.ts

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { CreateBuildingModalComponent } from './modals/create-building.component';
import { EditBuildingModalComponent } from './modals/edit-building.component';
import {TableAction, TableColumn, TableComponent} from '../../components/ui/tables/table.component';
import {ButtonComponent} from '../../components/ui/buttons/button.component';
import {BuildingService} from './access-data/building.service';
import {ResidenceService} from '../residences/ access-data/residence.service';
import {ModalService} from '../../components/ui/modals/modal.service';
import ToastService from '../../components/ui/toast/toast.service';
import {AuthService} from '../../../core/auth/auth.service';
import {Building, BuildingFilters} from './access-data/building.model';
import {Role} from '../../../core/auth/models/auth.model';
import { ManageBuildingSyndicsModalComponent } from './modals/manage-building-syndics.component';

@Component({
  selector: 'app-building-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableComponent,
    ButtonComponent
  ],
  templateUrl: './buildings.component.html',
  styleUrls: ['./buildings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuildingsComponent implements OnInit {
  private readonly buildingService = inject(BuildingService);
  private readonly residenceService = inject(ResidenceService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  buildings = signal<Building[]>([]);
  loading = signal(true);
  selectedBuildings = signal<Building[]>([]);
  currentRole = signal<Role | null>(this.auth.getRole());
  residenceOptions = signal<{ value: string; label: string }[]>([]);

  searchForm = this.fb.group({
    keyword: [''],
    residenceUuid: [''],
    status: ['']
  });

  private readonly refreshSubject = new Subject<void>();
  private readonly searchSubject = new Subject<BuildingFilters>();

  columns: TableColumn[] = [
    { key: 'name', label: 'Nom du bâtiment', sortable: true, width: '200px' },
    {
      key: 'residenceName',
      label: 'Résidence',
      sortable: true,
      width: '200px',
      format: (value: string) => `<span class="badge badge-residence">${value}</span>`
    },
    { key: 'address', label: 'Adresse', sortable: false, width: '250px' },
    {
      key: 'numberOfFloors',
      label: 'Étages',
      sortable: true,
      width: '100px',
      align: 'center'
    },
    {
      key: 'numberOfUnits',
      label: 'Unités',
      sortable: true,
      width: '100px',
      align: 'center'
    },
    {
      key: 'isActive',
      label: 'Statut',
      width: '100px',
      align: 'center',
      format: (value: boolean) => value
        ? '<span class="badge badge-success">Actif</span>'
        : '<span class="badge badge-danger">Inactif</span>'
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      sortable: true,
      width: '120px',
      format: (value: Date) => new Date(value).toLocaleDateString('fr-FR')
    }
  ];

  actions: TableAction[] = [
    {
      icon: this.getStatusIcon(),
      label: this.getStatusLabel(),
      callback: (row: Building) => this.toggleBuildingStatus(row),
      hidden: () => !this.isAdmin()
    },
    {
      icon: 'edit',
      label: 'Modifier',
      callback: (row: Building) => this.editBuilding(row),
      hidden: () => !this.isAdmin()
    },
     {
    icon: 'groups',
    label: 'Gérer les syndics',
    callback: (row: Building) => this.manageSyndics(row),
    hidden: () => !this.isAdmin()
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      callback: (row: Building) => this.deleteBuilding(row),
      hidden: () => !this.isAdmin()
    }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ];

  ngOnInit(): void {
    this.loadResidences();
    this.setupSearch();
    this.loadBuildings();
  }
  manageSyndics(building: Building): void {
  this.modal.open(ManageBuildingSyndicsModalComponent, {
    width: '600px',
    data: { building }
  }).afterClosed().subscribe((result) => {
    if (result) {
      this.toast.success('Syndics mis à jour avec succès');
    }
  });
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

  private setupSearch(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(filters => {
        this.searchSubject.next({
          keyword: filters.keyword || undefined,
          residenceUuid: filters.residenceUuid || undefined,
          status: filters.status as any || undefined
        });
      });

    merge(
      this.searchSubject.pipe(
        tap(() => this.loading.set(true)),
        switchMap(filters => this.fetchBuildings(filters))
      ),
      this.refreshSubject.pipe(
        tap(() => this.loading.set(true)),
        switchMap(() => this.fetchBuildings())
      )
    ).subscribe({
      next: (buildings) => {
        this.buildings.set(buildings);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des bâtiments');
        this.loading.set(false);
      }
    });
  }

  private fetchBuildings(filters?: BuildingFilters) {
    return this.buildingService.getBuildings({
      residenceUuid: filters?.residenceUuid,
      active:
        filters?.status === 'active'
          ? true
          : filters?.status === 'inactive'
            ? false
            : undefined
    });
  }

  loadBuildings(): void {
    this.refreshSubject.next();
  }

  openCreateModal(): void {
    this.modal.open(CreateBuildingModalComponent, {
      width: '700px',
      data: { mode: 'create' }
    }).afterClosed().subscribe((result: Building) => {
      if (result) {
        this.loadBuildings();
      }
    });
  }

  editBuilding(building: Building): void {
    this.modal.open(EditBuildingModalComponent, {
      width: '700px',
      data: { building, mode: 'edit' }
    }).afterClosed().subscribe((result: Building) => {
      if (result) {
        this.loadBuildings();
        this.toast.success('Bâtiment modifié avec succès');
      }
    });
  }

  toggleBuildingStatus(building: Building): void {
    const action = building.isActive ? 'désactiver' : 'activer';
    this.modal.confirm({
      title: 'Confirmation',
      message: `Voulez-vous ${action} le bâtiment ${building.name} ?`,
      type: 'warning',
      confirmText: 'Oui',
      cancelText: 'Non'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.buildingService.toggleBuildingStatus(building.uuid).subscribe({
          next: () => {
            this.toast.success(`Bâtiment ${action} avec succès`);
            this.loadBuildings();
          },
          error: () => this.toast.error(`Erreur lors de la ${action}tion`)
        });
      }
    });
  }

  deleteBuilding(building: Building): void {
    this.modal.confirmDelete(building.name).subscribe((confirmed) => {
      if (confirmed) {
        this.buildingService.deleteBuilding(building.uuid).subscribe({
          next: () => {
            this.toast.delete('Bâtiment supprimé avec succès');
            this.loadBuildings();
          },
          error: () => this.toast.error('Erreur lors de la suppression')
        });
      }
    });
  }

  onSelectionChange(selectedRows: Building[]): void {
    this.selectedBuildings.set(selectedRows);
  }

  isAdmin(): boolean {
    return this.currentRole() === 'ADMIN';
  }

  private getStatusIcon(): (row: Building) => string {
    return (row: Building) => row.isActive ? 'toggle_off' : 'toggle_on';
  }

  private getStatusLabel(): (row: Building) => string {
    return (row: Building) => row.isActive ? 'Désactiver' : 'Activer';
  }
}
