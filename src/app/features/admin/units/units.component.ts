import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { Unit, UnitFilters, UnitType } from './access-data/unit.model';
import { UnitService } from './access-data/unit.service';
import { BuildingService } from '../buildings/access-data/building.service';
import { CreateUnitModalComponent } from './modals/create-unit.component';
import { EditUnitModalComponent } from './modals/edit-unit.component';
import {TableAction, TableColumn, TableComponent} from '../../components/ui/tables/table.component';
import {ButtonComponent} from '../../components/ui/buttons/button.component';
import {ResidenceService} from '../residences/ access-data/residence.service';
import {ModalService} from '../../components/ui/modals/modal.service';
import ToastService from '../../components/ui/toast/toast.service';
import {AuthService} from '../../../core/auth/auth.service';
import {Role} from '../../../core/auth/models/auth.model';

@Component({
  selector: 'app-unit-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableComponent,
    ButtonComponent
  ],
  templateUrl: './units.component.html',
  styleUrls: ['./units.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitsComponent implements OnInit {
  private readonly unitService = inject(UnitService);
  private readonly buildingService = inject(BuildingService);
  private readonly residenceService = inject(ResidenceService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  units = signal<Unit[]>([]);
  loading = signal(true);
  selectedUnits = signal<Unit[]>([]);
  currentRole = signal<Role | null>(this.auth.getRole());
  buildingOptions = signal<{ value: string; label: string }[]>([]);
  residenceOptions = signal<{ value: string; label: string }[]>([]);

  searchForm = this.fb.group({
    keyword: [''],
    residenceUuid: [''],
    buildingUuid: [''],
    type: [''],
    occupied: [''],
    status: ['']
  });

  private readonly refreshSubject = new Subject<void>();
  private readonly searchSubject = new Subject<UnitFilters>();

  columns: TableColumn[] = [
    { key: 'unitNumber', label: 'N° Unité', sortable: true, width: '120px' },
    {
      key: 'residenceName',
      label: 'Résidence',
      sortable: true,
      width: '180px',
      format: (value: string) => `<span class="badge badge-residence">${value}</span>`
    },
    {
      key: 'buildingName',
      label: 'Bâtiment',
      sortable: true,
      width: '150px',
      format: (value: string) => `<span class="badge badge-building">${value}</span>`
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      width: '140px',
      format: (value: UnitType) => {
        const labels: Record<UnitType, string> = {
          [UnitType.APARTMENT]: 'Appartement',
          [UnitType.STUDIO]: 'Studio',
          [UnitType.DUPLEX]: 'Duplex',
          [UnitType.PENTHOUSE]: 'Penthouse',
          [UnitType.COMMERCIAL]: 'Commercial',
          [UnitType.PARKING]: 'Parking',
          [UnitType.STORAGE]: 'Stockage'
        };
        return `<span class="badge badge-type">${labels[value]}</span>`;
      }
    },
    {
      key: 'floorNumber',
      label: 'Étage',
      sortable: true,
      width: '80px',
      align: 'center'
    },
    {
      key: 'area',
      label: 'Surface (m²)',
      sortable: true,
      width: '120px',
      align: 'center',
      format: (value: number) => value ? `${value} m²` : '-'
    },
    {
      key: 'numberOfRooms',
      label: 'Pièces',
      sortable: true,
      width: '80px',
      align: 'center',
    },
    {
      key: 'isOccupied',
      label: 'Occupation',
      width: '120px',
      align: 'center',
      format: (value: boolean) => value
        ? '<span class="badge badge-danger">Occupé</span>'
        : '<span class="badge badge-success">Disponible</span>'
    },
  ];

  actions: TableAction[] = [
    {
      icon: this.getOccupancyIcon(),
      label: this.getOccupancyLabel(),
      callback: (row: Unit) => this.toggleUnitOccupancy(row),
      hidden: () => !this.isAdminOrSyndic()
    },
    {
      icon: 'edit',
      label: 'Modifier',
      callback: (row: Unit) => this.editUnit(row),
      hidden: () => !this.isAdmin()
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      callback: (row: Unit) => this.deleteUnit(row),
      hidden: () => !this.isAdmin()
    }
  ];

  typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: UnitType.APARTMENT, label: 'Appartement' },
    { value: UnitType.STUDIO, label: 'Studio' },
    { value: UnitType.DUPLEX, label: 'Duplex' },
    { value: UnitType.PENTHOUSE, label: 'Penthouse' },
    { value: UnitType.COMMERCIAL, label: 'Commercial' },
    { value: UnitType.PARKING, label: 'Parking' },
    { value: UnitType.STORAGE, label: 'Stockage' }
  ];

  occupancyOptions = [
    { value: '', label: 'Toutes' },
    { value: 'false', label: 'Disponibles' },
    { value: 'true', label: 'Occupées' }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ];

  ngOnInit(): void {
    this.loadResidences();
    this.loadBuildings();
    this.setupSearch();
    this.loadUnits();
    this.setupResidenceWatcher();
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

  private setupResidenceWatcher(): void {
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
          }
        });
      } else {
        this.loadBuildings();
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
          buildingUuid: filters.buildingUuid || undefined,
          type: filters.type as UnitType || undefined,
          occupied: filters.occupied ? filters.occupied === 'true' : undefined,
          status: filters.status as any || undefined
        });
      });

    merge(
      this.searchSubject.pipe(
        tap(() => this.loading.set(true)),
        switchMap(filters => this.fetchUnits(filters))
      ),
      this.refreshSubject.pipe(
        tap(() => this.loading.set(true)),
        switchMap(() => this.fetchUnits())
      )
    ).subscribe({
      next: (units) => {
        this.units.set(units);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des unités');
        this.loading.set(false);
      }
    });
  }

  private fetchUnits(filters?: UnitFilters) {
    return this.unitService.getUnits({
      buildingUuid: filters?.buildingUuid,
      residenceUuid: filters?.residenceUuid,
      type: filters?.type,
      occupied: filters?.occupied,
      active:
        filters?.status === 'active'
          ? true
          : filters?.status === 'inactive'
            ? false
            : undefined
    });
  }

  loadUnits(): void {
    this.refreshSubject.next();
  }

  openCreateModal(): void {
    this.modal.open(CreateUnitModalComponent, {
      width: '800px',
      data: { mode: 'create' }
    }).afterClosed().subscribe((result: Unit) => {
      if (result) {
        this.loadUnits();
      }
    });
  }

  editUnit(unit: Unit): void {
    this.modal.open(EditUnitModalComponent, {
      width: '800px',
      data: { unit, mode: 'edit' }
    }).afterClosed().subscribe((result: Unit) => {
      if (result) {
        this.loadUnits();
        this.toast.success('Unité modifiée avec succès');
      }
    });
  }

  toggleUnitStatus(unit: Unit): void {
    const action = unit.isActive ? 'désactiver' : 'activer';
    this.modal.confirm({
      title: 'Confirmation',
      message: `Voulez-vous ${action} l'unité ${unit.unitNumber} ?`,
      type: 'warning',
      confirmText: 'Oui',
      cancelText: 'Non'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.unitService.toggleUnitStatus(unit.uuid).subscribe({
          next: () => {
            this.toast.success(`Unité ${action} avec succès`);
            this.loadUnits();
          },
          error: () => this.toast.error(`Erreur lors de la ${action}tion`)
        });
      }
    });
  }

  toggleUnitOccupancy(unit: Unit): void {
    const action = unit.isOccupied ? 'libérer' : 'occuper';
    this.modal.confirm({
      title: 'Confirmation',
      message: `Voulez-vous ${action} l'unité ${unit.unitNumber} ?`,
      type: 'warning',
      confirmText: 'Oui',
      cancelText: 'Non'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.unitService.toggleUnitOccupancy(unit.uuid).subscribe({
          next: () => {
            this.toast.success(`Unité ${action === 'libérer' ? 'libérée' : 'occupée'} avec succès`);
            this.loadUnits();
          },
          error: () => this.toast.error(`Erreur lors de l'opération`)
        });
      }
    });
  }

  deleteUnit(unit: Unit): void {
    this.modal.confirmDelete(`l'unité ${unit.unitNumber}`).subscribe((confirmed) => {
      if (confirmed) {
        this.unitService.deleteUnit(unit.uuid).subscribe({
          next: () => {
            this.toast.delete('Unité supprimée avec succès');
            this.loadUnits();
          },
          error: () => this.toast.error('Erreur lors de la suppression')
        });
      }
    });
  }

  onSelectionChange(selectedRows: Unit[]): void {
    this.selectedUnits.set(selectedRows);
  }

  isAdmin(): boolean {
    return this.currentRole() === 'ADMIN';
  }

  isAdminOrSyndic(): boolean {
    const role = this.currentRole();
    return role === 'ADMIN' || role === 'SYNDIC';
  }

  private getStatusIcon(): (row: Unit) => string {
    return (row: Unit) => row.isActive ? 'toggle_off' : 'toggle_on';
  }

  private getStatusLabel(): (row: Unit) => string {
    return (row: Unit) => row.isActive ? 'Désactiver' : 'Activer';
  }

  private getOccupancyIcon(): (row: Unit) => string {
    return (row: Unit) => row.isOccupied ? 'meeting_room' : 'no_meeting_room';
  }

  private getOccupancyLabel(): (row: Unit) => string {
    return (row: Unit) => row.isOccupied ? 'Libérer' : 'Marquer occupé';
  }
}
