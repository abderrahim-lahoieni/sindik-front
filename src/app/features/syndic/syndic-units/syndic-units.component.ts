// Mise à jour de src/app/features/syndic/units/syndic-units.component.ts

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { Unit, UnitFilters, UnitType } from '../../admin/units/access-data/unit.model';
import { UnitService } from '../../admin/units/access-data/unit.service';
import { SyndicBuildingService } from '../access-data/syndic-building.service';
import { ButtonComponent } from '../../components/ui/buttons/button.component';
import { TableAction, TableColumn, TableComponent } from '../../components/ui/tables/table.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ModalService } from '../../components/ui/modals/modal.service';
import ToastService from '../../components/ui/toast/toast.service';
import { CreateUnitSyndicModalComponent } from './modals/create-unit-syndic.component';

@Component({
  selector: 'app-syndic-units',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableComponent,
    ButtonComponent
  ],
  templateUrl: './syndic-units.component.html',
  styleUrls: ['./syndic-units.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SyndicUnitsComponent implements OnInit {
  private readonly unitService = inject(UnitService);
  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  units = signal<Unit[]>([]);
  loading = signal(true);
  buildingOptions = signal<{ value: string; label: string }[]>([]);

  searchForm = this.fb.group({
    buildingUuid: [''],
    type: [''],
    occupied: ['']
  });

  private readonly refreshSubject = new Subject<void>();
  private readonly searchSubject = new Subject<UnitFilters>();

  columns: TableColumn[] = [
    { key: 'unitNumber', label: 'N° Unité', sortable: true, width: '120px' },
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
      align: 'center'
    },
    {
      key: 'isOccupied',
      label: 'Occupation',
      width: '120px',
      align: 'center',
      format: (value: boolean) => value
        ? '<span class="badge badge-danger">Occupé</span>'
        : '<span class="badge badge-success">Disponible</span>'
    }
  ];

  actions: TableAction[] = [
    {
      icon: (row: Unit) => row.isOccupied ? 'meeting_room' : 'no_meeting_room',
      label: (row: Unit) => row.isOccupied ? 'Libérer' : 'Marquer occupé',
      callback: (row: Unit) => this.toggleOccupancy(row)
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

  ngOnInit(): void {
    this.loadMyBuildings();
    this.setupSearch();

    this.route.queryParams.subscribe(params => {
      if (params['buildingUuid']) {
        this.searchForm.patchValue({ buildingUuid: params['buildingUuid'] });
      } else {
        this.loadUnits();
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

  private setupSearch(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(filters => {
        this.searchSubject.next({
          buildingUuid: filters.buildingUuid || undefined,
          type: filters.type as UnitType || undefined,
          occupied: filters.occupied ? filters.occupied === 'true' : undefined
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
      type: filters?.type,
      occupied: filters?.occupied
    });
  }

  loadUnits(): void {
    this.refreshSubject.next();
  }

  // NOUVEAU: Créer une unité
  openCreateModal(): void {
    this.modal.open(CreateUnitSyndicModalComponent, {
      width: '800px',
      data: { mode: 'create' }
    }).afterClosed().subscribe((result: Unit) => {
      if (result) {
        this.loadUnits();
      }
    });
  }

  toggleOccupancy(unit: Unit): void {
    const action = unit.isOccupied ? 'libérer' : 'marquer comme occupé';
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
            this.toast.success(`Unité ${action === 'libérer' ? 'libérée' : 'marquée occupée'} avec succès`);
            this.loadUnits();
          },
          error: () => this.toast.error(`Erreur lors de l'opération`)
        });
      }
    });
  }
}