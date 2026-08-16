// src/app/features/admin/users/user.component.ts

import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {debounceTime, distinctUntilChanged, map, switchMap, tap} from 'rxjs/operators';
import {merge, Subject} from 'rxjs';
import {TableAction, TableColumn, TableComponent} from "../../../components/ui/tables/table.component";
import {User, UserFilters} from '../access-data/user.model';
import {UserService} from '../access-data/user.service';
import {ModalService} from '../../../components/ui/modals/modal.service';
import ToastService from '../../../components/ui/toast/toast.service';
import {AuthService} from '../../../../core/auth/auth.service';
import {Role} from '../../../../core/auth/models/auth.model';
import {ButtonComponent} from '../../../components/ui/buttons/button.component';
import {CreateUserModalComponent} from '../modals/create-user.component';
import {EditUserModalComponent} from '../modals/edit-user.component';
import {AssignSyndicBuildingsModalComponent} from '../modals/assign-syndic-buildings.component';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableComponent,
    ButtonComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Signals
  users = signal<User[]>([]);
  loading = signal(true);
  selectedUsers = signal<User[]>([]);
  currentRole = signal<Role | null>(this.auth.getRole());

  // Search form
  searchForm = this.fb.group({
    keyword: [''],
    role: [''],
    status: ['']
  });

  private readonly refreshSubject = new Subject<void>();
  private readonly searchSubject = new Subject<UserFilters>();

  // Table columns
  columns: TableColumn[] = [
    { key: 'fullName', label: 'Nom complet', sortable: true, width: '200px' },
    { key: 'email', label: 'Email', sortable: true, width: '250px' },
    {
      key: 'role',
      label: 'Rôle',
      sortable: true,
      width: '120px',
      format: (value: Role) => `<span class="badge badge-${value.toLowerCase()}">${value}</span>`
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
    // {
    //   key: 'isAccountNonLocked',
    //   label: 'Verrouillage',
    //   width: '120px',
    //   align: 'center',
    //   format: (value: boolean) => value
    //     ? '<span class="badge badge-success">Déverrouillé</span>'
    //     : '<span class="badge badge-warning">Verrouillé</span>'
    // },
    {
      key: 'lastLogin',
      label: 'Dernière connexion',
      sortable: true,
      width: '180px',
      format: (value: Date | null) => value
        ? new Date(value).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        : '<span class="text-muted">Jamais</span>'
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      sortable: true,
      width: '120px',
      format: (value: Date) => new Date(value).toLocaleDateString('fr-FR')
    }
  ];

  // Table actions
  actions: TableAction[] = [
    // {
    //   icon: 'visibility',
    //   label: 'Voir détails',
    //   callback: (row: User) => this.viewUserDetails(row),
    //   hidden: (row: User) => !this.isAdmin()
    // },

    {
      icon: this.getStatusIcon('active'),
      label: this.getStatusLabel('active'),
      callback: (row: User) => this.toggleUserStatus(row),
      hidden: (row: User) => !this.isAdmin()
    },
    {
      icon: 'edit',
      label: 'Modifier',
      callback: (row: User) => this.editUser(row),
      hidden: (row: User) => !this.isAdmin()
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      callback: (row: User) => this.deleteUser(row),
      hidden: (row: User) => !this.isAdmin() || row.email === 'admin@example.com'
    },
    {
      icon: 'business',
      label: 'Gérer bâtiments',
      callback: (row: User) => this.manageSyndicBuildings(row),
      hidden: (row: User) => row.role !== Role.S || !this.isAdmin()
    }
  ];
  // NOUVELLE MÉTHODE
  manageSyndicBuildings(syndic: User): void {
    this.modal.open(AssignSyndicBuildingsModalComponent, {
      width: '700px',
      data: { syndic }
    }).afterClosed().subscribe((result) => {
      if (result) {
        // Assignation réussie
      }
    });
  }

  // Filter options
  roleOptions = [
    { value: '', label: 'Tous les rôles' },
    { value: Role.A, label: 'Admin' },
    { value: Role.R, label: 'Resident' },
    { value: Role.S, label: 'Syndic' }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ];

  ngOnInit(): void {
  this.setupSearch();

  //  Lire les query params
  this.route.queryParams.subscribe(params => {
    if (params['role']) {
      this.searchForm.patchValue({
        role: params['role']
      });
    }

    this.loadUsers();
  });
}

  private setupSearch(): void {
    // Écoute les changements du formulaire
   this.searchForm.valueChanges
  .pipe(
    debounceTime(300),
    distinctUntilChanged()
  )
  .subscribe(filters => {

    // 🔥 Mettre à jour l'URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        role: filters.role || null,
        status: filters.status || null,
        keyword: filters.keyword || null
      },
      queryParamsHandling: 'merge'
    });

    this.searchSubject.next({
      keyword: filters.keyword || undefined,
      role: filters.role as Role || undefined,
      status: filters.status as any || undefined
    });
  });

    // Écoute les recherches et les rafraîchissements
    merge(
      this.searchSubject.pipe(
        tap(() => this.loading.set(true)),
        switchMap(filters => this.fetchUsers(filters))
      ),
      this.refreshSubject.pipe(
        tap(() => this.loading.set(true)),
        switchMap(() => this.fetchUsers())
      )
    ).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des utilisateurs');
        this.loading.set(false);
      }
    });
  }

  private fetchUsers(filters?: UserFilters) {
    return this.userService.getUsers({
      role: filters?.role,
      active:
        filters?.status === 'active'
          ? true
          : filters?.status === 'inactive'
            ? false
            : undefined
    });
  }

  loadUsers(): void {
    this.refreshSubject.next();
  }

  //Actions utilisateur
  openCreateModal(): void {
    this.modal.open(CreateUserModalComponent, {
      width: '600px',
      data: { mode: 'create' }
    }).afterClosed().subscribe((result: User) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  editUser(user: User): void {
    this.modal.open(EditUserModalComponent, {
      width: '600px',
      data: { user, mode: 'edit' }
    }).afterClosed().subscribe((result: User) => {
      if (result) {
        this.loadUsers();
        this.toast.success('Utilisateur modifié avec succès');
      }
    });
  }

  viewUserDetails(user: User): void {
    // Ouvre un modal de détails (à implémenter)
    this.modal.alert(
      `Détails de l'utilisateur\n\n` +
      `Nom: ${user.fullName}\n` +
      `Email: ${user.email}\n` +
      `Rôle: ${user.role}\n` +
      `Statut: ${user.isActive ? 'Actif' : 'Inactif'}\n` +
      `Compte verrouillé: ${user.isAccountNonLocked ? 'Non' : 'Oui'}\n` +
      `Créé le: ${new Date(user.createdAt).toLocaleDateString('fr-FR')}\n` +
      `Dernière connexion: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}`
    ).subscribe();
  }

  toggleUserStatus(user: User): void {
    const action = user.isActive ? 'désactiver' : 'activer';
    this.modal.confirm({
      title: 'Confirmation',
      message: `Voulez-vous ${action} l'utilisateur ${user.fullName} ?`,
      type: 'warning',
      confirmText: 'Oui',
      cancelText: 'Non'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.userService.toggleUserStatus(user.uuid).subscribe({
          next: () => {
            this.toast.success(`Utilisateur ${action} avec succès`);
            this.loadUsers();
          },
          error: () => this.toast.error(`Erreur lors de la ${action}tion`)
        });
      }
    });
  }

  deleteUser(user: User): void {
    this.modal.confirmDelete(user.fullName).subscribe((confirmed) => {
      if (confirmed) {
        this.userService.deleteUser(user.uuid).subscribe({
          next: () => {
            this.toast.delete('Utilisateur supprimé avec succès');
            this.loadUsers();
          },
          error: () => this.toast.error('Erreur lors de la suppression')
        });
      }
    });
  }

  // Bulk actions
  onSelectionChange(selectedRows: User[]): void {
    this.selectedUsers.set(selectedRows);
  }

  bulkDelete(): void {
    const count = this.selectedUsers().length;
    this.modal.confirm({
      title: 'Confirmation',
      message: `Voulez-vous supprimer ${count} utilisateur(s) ?`,
      type: 'warning',
      confirmText: 'Oui',
      cancelText: 'Non'
    }).subscribe((confirmed) => {
      if (confirmed) {
        // Implémenter bulk delete si backend le supporte
        this.toast.info('Fonctionnalité à implémenter');
      }
    });
  }

  // Helpers
  isAdmin(): boolean {
    return this.currentRole() === 'ADMIN';
  }

  private getStatusIcon(type: 'active' | 'lock'): (row: User) => string {
    return (row: User) => {
      if (type === 'active') {
        return row.isActive ? 'toggle_off' : 'toggle_on';
      }
      return row.isAccountNonLocked ? 'lock' : 'lock_open';
    };
  }

  private getStatusLabel(type: 'active' | 'lock'): (row: User) => string {
    return (row: User) => {
      if (type === 'active') {
        return row.isActive ? 'Désactiver' : 'Activer';
      }
      return row.isAccountNonLocked ? 'Verrouiller' : 'Déverrouiller';
    };
  }
}
