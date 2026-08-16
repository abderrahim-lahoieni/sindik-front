// src/app/features/admin/residences/residences.component.ts

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import {Residence, ResidenceFilters, ResidenceType} from './ access-data/residence.model';
import {TableAction, TableColumn, TableComponent} from '../../components/ui/tables/table.component';
import {ButtonComponent} from '../../components/ui/buttons/button.component';
import {ResidenceService} from './ access-data/residence.service';
import {ModalService} from '../../components/ui/modals/modal.service';
import ToastService from '../../components/ui/toast/toast.service';
import {AuthService} from '../../../core/auth/auth.service';
import {Role} from '../../../core/auth/models/auth.model';
import {EditResidenceModalComponent} from './modals/edit-residence.component';
import {CreateResidenceModalComponent} from './modals/create-residence.component';

@Component({
  selector: 'app-residence-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableComponent,
    ButtonComponent
  ],
  templateUrl: './residences.component.html',
  styleUrls: ['./residences.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResidencesComponent implements OnInit {
  private readonly residenceService = inject(ResidenceService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  residences = signal<Residence[]>([]);
  loading = signal(true);
  selectedResidences = signal<Residence[]>([]);
  currentRole = signal<Role | null>(this.auth.getRole());

  searchForm = this.fb.group({
    keyword: [''],
    type: [''],
    status: ['']
  });

  private readonly refreshSubject = new Subject<void>();
  private readonly searchSubject = new Subject<ResidenceFilters>();

  columns: TableColumn[] = [
    { key: 'name', label: 'Nom', sortable: true, width: '200px' },
    { key: 'city', label: 'Ville', sortable: true, width: '150px' },
    { key: 'address', label: 'Adresse', sortable: false, width: '250px' },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      width: '180px',
      format: (value: ResidenceType) => {
        const labels: Record<ResidenceType, string> = {
          [ResidenceType.APARTMENT_BUILDING]: 'Immeuble',
          [ResidenceType.TOWNHOUSE_COMPLEX]: 'Complexe',
          [ResidenceType.CONDOMINIUM]: 'Copropriété',
          [ResidenceType.GATED_COMMUNITY]: 'Fermée',
          [ResidenceType.MIXED_USE]: 'Mixte'
        };
        return `<span class="badge badge-type">${labels[value]}</span>`;
      }
    },
    {
      key: 'numberOfBuildings',
      label: 'Bâtiments',
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
      callback: (row: Residence) => this.toggleResidenceStatus(row),
      hidden: () => !this.isAdmin()
    },
    {
      icon: 'edit',
      label: 'Modifier',
      callback: (row: Residence) => this.editResidence(row),
      hidden: () => !this.isAdmin()
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      callback: (row: Residence) => this.deleteResidence(row),
      hidden: () => !this.isAdmin()
    }
  ];

  typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: ResidenceType.APARTMENT_BUILDING, label: 'Immeuble' },
    { value: ResidenceType.TOWNHOUSE_COMPLEX, label: 'Complexe' },
    { value: ResidenceType.CONDOMINIUM, label: 'Copropriété' },
    { value: ResidenceType.GATED_COMMUNITY, label: 'Résidence Fermée' },
    { value: ResidenceType.MIXED_USE, label: 'Mixte' }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ];

  ngOnInit(): void {
    this.setupSearch();
    this.loadResidences();
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
          type: filters.type as ResidenceType || undefined,
          status: filters.status as any || undefined
        });
      });

    merge(
      this.searchSubject.pipe(
        tap(() => this.loading.set(true)),
        switchMap(filters => this.fetchResidences(filters))
      ),
      this.refreshSubject.pipe(
        tap(() => this.loading.set(true)),
        switchMap(() => this.fetchResidences())
      )
    ).subscribe({
      next: (residences) => {
        this.residences.set(residences);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des résidences');
        this.loading.set(false);
      }
    });
  }

  private fetchResidences(filters?: ResidenceFilters) {
    return this.residenceService.getResidences({
      type: filters?.type,
      active:
        filters?.status === 'active'
          ? true
          : filters?.status === 'inactive'
            ? false
            : undefined
    });
  }

  loadResidences(): void {
    this.refreshSubject.next();
  }

  openCreateModal(): void {
    this.modal.open(CreateResidenceModalComponent, {
      width: '700px',
      data: { mode: 'create' }
    }).afterClosed().subscribe((result: Residence) => {
      if (result) {
        this.loadResidences();
      }
    });
  }

  editResidence(residence: Residence): void {
    this.modal.open(EditResidenceModalComponent, {
      width: '700px',
      data: { residence, mode: 'edit' }
    }).afterClosed().subscribe((result: Residence) => {
      if (result) {
        this.loadResidences();
        this.toast.success('Résidence modifiée avec succès');
      }
    });
  }

  toggleResidenceStatus(residence: Residence): void {
    const action = residence.isActive ? 'désactiver' : 'activer';
    this.modal.confirm({
      title: 'Confirmation',
      message: `Voulez-vous ${action} la résidence ${residence.name} ?`,
      type: 'warning',
      confirmText: 'Oui',
      cancelText: 'Non'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.residenceService.toggleResidenceStatus(residence.uuid).subscribe({
          next: () => {
            this.toast.success(`Résidence ${action} avec succès`);
            this.loadResidences();
          },
          error: () => this.toast.error(`Erreur lors de la ${action}tion`)
        });
      }
    });
  }

  deleteResidence(residence: Residence): void {
    this.modal.confirmDelete(residence.name).subscribe((confirmed) => {
      if (confirmed) {
        this.residenceService.deleteResidence(residence.uuid).subscribe({
          next: () => {
            this.toast.delete('Résidence supprimée avec succès');
            this.loadResidences();
          },
          error: () => this.toast.error('Erreur lors de la suppression')
        });
      }
    });
  }

  onSelectionChange(selectedRows: Residence[]): void {
    this.selectedResidences.set(selectedRows);
  }

  isAdmin(): boolean {
    return this.currentRole() === 'ADMIN';
  }

  private getStatusIcon(): (row: Residence) => string {
    return (row: Residence) => row.isActive ? 'toggle_off' : 'toggle_on';
  }

  private getStatusLabel(): (row: Residence) => string {
    return (row: Residence) => row.isActive ? 'Désactiver' : 'Activer';
  }

  openDetails(residence: Residence): void {
    this.modal.open(EditResidenceModalComponent, {
      width: '700px',
      data: {
        residence,
        mode: 'view' // 👈 mode lecture seule
      }
    });
  }

}
