// src/app/features/syndic/contracts/contracts.component.ts

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { ContractService } from './access-data/contract.service';
import { SyndicBuildingService } from '../access-data/syndic-building.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ModalService } from '../../components/ui/modals/modal.service';
import ToastService from '../../components/ui/toast/toast.service';
import { TableComponent, TableColumn, TableAction } from '../../components/ui/tables/table.component';
import { ButtonComponent } from '../../components/ui/buttons/button.component';
import { Contract, ContractFilters, ContractStatus, ContractType } from './access-data/contract.model';
import { CreateContractModalComponent } from './modals/create-contract.component';
import { EditContractModalComponent } from './modals/edit-contract.component';
import { Router } from '@angular/router';


@Component({
    selector: 'app-syndic-contracts',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TableComponent,
        ButtonComponent
    ],
    templateUrl: './contracts.component.html',
    styleUrls: ['./contracts.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SyndicContractsComponent implements OnInit {
    private readonly contractService = inject(ContractService);
    private readonly syndicBuildingService = inject(SyndicBuildingService);
    private readonly auth = inject(AuthService);
    private readonly modal = inject(ModalService);
    private readonly toast = inject(ToastService);
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);

    contracts = signal<Contract[]>([]);
    loading = signal(true);
    buildingOptions = signal<{ value: string; label: string }[]>([]);

    searchForm = this.fb.group({
        buildingUuid: [''],
        type: [''],
        status: ['']
    });

    private readonly refreshSubject = new Subject<void>();
    private readonly searchSubject = new Subject<ContractFilters>();

    columns: TableColumn[] = [
        { key: 'contractNumber', label: 'N° Contrat', sortable: true, width: '140px' },
        { key: 'residentName', label: 'Résident', sortable: true, width: '180px' },
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
            key: 'type',
            label: 'Type',
            width: '120px',
            format: (value: ContractType) => {
                const labels: Record<ContractType, string> = {
                    [ContractType.RENTAL]: 'Location',
                    [ContractType.OWNERSHIP]: 'Propriété',
                    [ContractType.SUBLEASE]: 'Sous-location',
                    [ContractType.COMMERCIAL]: 'Commercial',
                    [ContractType.PARKING]: 'Parking',
                    [ContractType.STORAGE]: 'Stockage'
                };
                return `<span class="badge badge-type">${labels[value]}</span>`;
            }
        },
        {
            key: 'status',
            label: 'Statut',
            width: '120px',
            align: 'center',
            format: (value: ContractStatus) => {
                const config: Record<ContractStatus, { label: string; class: string }> = {
                    [ContractStatus.DRAFT]: { label: 'Brouillon', class: 'badge-draft' },
                    [ContractStatus.ACTIVE]: { label: 'Actif', class: 'badge-active' },
                    [ContractStatus.PENDING]: { label: 'En attente', class: 'badge-pending' },
                    [ContractStatus.EXPIRED]: { label: 'Expiré', class: 'badge-expired' },
                    [ContractStatus.TERMINATED]: { label: 'Résilié', class: 'badge-terminated' },
                    [ContractStatus.RENEWED]: { label: 'Renouvelé', class: 'badge-renewed' }
                };
                return `<span class="badge ${config[value].class}">${config[value].label}</span>`;
            }
        },
        {
            key: 'monthlyRent',
            label: 'Loyer mensuel',
            sortable: true,
            width: '130px',
            align: 'right',
            format: (value: number) => `${value.toLocaleString('fr-FR')} MAD`
        },
        {
            key: 'startDate',
            label: 'Date début',
            sortable: true,
            width: '110px',
            format: (value: Date) => new Date(value).toLocaleDateString('fr-FR')
        },
        {
            key: 'endDate',
            label: 'Date fin',
            sortable: true,
            width: '110px',
            format: (value: Date) => value ? new Date(value).toLocaleDateString('fr-FR') : '-'
        }
    ];

    viewContract(contract: Contract): void {
        this.router.navigate(['/syndik/contracts/view', contract.uuid]);
    }

    actions: TableAction[] = [
        {
            icon: 'visibility',
            label: 'Voir détails',
            callback: (row: Contract) => this.viewContract(row)
        },
        {
            icon: 'edit',
            label: 'Modifier',
            callback: (row: Contract) => this.editContract(row)
        },
        {
            icon: 'description',
            label: 'Voir paiements',
            callback: (row: Contract) => this.viewPayments(row)
        }
    ];

    contractTypeOptions = [
        { value: '', label: 'Tous les types' },
        { value: ContractType.RENTAL, label: 'Location' },
        { value: ContractType.OWNERSHIP, label: 'Propriété' },
        { value: ContractType.SUBLEASE, label: 'Sous-location' },
        { value: ContractType.COMMERCIAL, label: 'Commercial' },
        { value: ContractType.PARKING, label: 'Parking' },
        { value: ContractType.STORAGE, label: 'Stockage' }
    ];

    contractStatusOptions = [
        { value: '', label: 'Tous les statuts' },
        { value: ContractStatus.DRAFT, label: 'Brouillon' },
        { value: ContractStatus.ACTIVE, label: 'Actif' },
        { value: ContractStatus.PENDING, label: 'En attente' },
        { value: ContractStatus.EXPIRED, label: 'Expiré' },
        { value: ContractStatus.TERMINATED, label: 'Résilié' },
        { value: ContractStatus.RENEWED, label: 'Renouvelé' }
    ];

    ngOnInit(): void {
        this.loadMyBuildings();
        this.setupSearch();
        this.loadContracts();
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
                    type: filters.type as ContractType || undefined,
                    status: filters.status as ContractStatus || undefined
                });
            });

        merge(
            this.searchSubject.pipe(
                tap(() => this.loading.set(true)),
                switchMap(filters => this.fetchContracts(filters))
            ),
            this.refreshSubject.pipe(
                tap(() => this.loading.set(true)),
                switchMap(() => this.fetchContracts())
            )
        ).subscribe({
            next: (contracts) => {
                this.contracts.set(contracts);
                this.loading.set(false);
            },
            error: () => {
                this.toast.error('Erreur lors du chargement des contrats');
                this.loading.set(false);
            }
        });
    }

    private fetchContracts(filters?: ContractFilters) {
        return this.contractService.getContracts(filters);
    }

    loadContracts(): void {
        this.refreshSubject.next();
    }

    openCreateModal(): void {
        this.modal.open(CreateContractModalComponent, {
            width: '900px',
            data: { mode: 'create' }
        }).afterClosed().subscribe((result: Contract) => {
            if (result) {
                this.loadContracts();
            }
        });
    }
    // Remplacer la méthode openCreateModal par:

    // editContract(contract: Contract): void {
    //     this.modal.open(EditContractModalComponent, {
    //         width: '900px',
    //         data: { contract, mode: 'edit' }
    //     }).afterClosed().subscribe((result: Contract) => {
    //         if (result) {
    //             this.loadContracts();
    //             this.toast.success('Contrat modifié avec succès');
    //         }
    //     });
    // }
    // Méthodes de navigation
    openCreatePage(): void {
        this.router.navigate(['/syndik/contracts/create']);
    }

    editContract(contract: Contract): void {
        this.router.navigate(['/syndik/contracts/edit', contract.uuid]);
    }

    viewDetails(contract: Contract): void {
        const depositStatus = contract.depositPaid ? 'Payée' : 'Non payée';
        const autoRenew = contract.autoRenewable ? 'Oui' : 'Non';

        this.modal.alert(
            `Détails du contrat\n\n` +
            `Numéro: ${contract.contractNumber}\n` +
            `Résident: ${contract.residentName}\n` +
            `Unité: ${contract.unitNumber} - ${contract.buildingName}\n` +
            `Type: ${contract.type}\n` +
            `Statut: ${contract.status}\n` +
            `Loyer mensuel: ${contract.monthlyRent.toLocaleString('fr-FR')} MAD\n` +
            `Caution: ${contract.depositAmount ? contract.depositAmount.toLocaleString('fr-FR') + ' MAD (' + depositStatus + ')' : 'Non spécifiée'}\n` +
            `Date début: ${new Date(contract.startDate).toLocaleDateString('fr-FR')}\n` +
            `Date fin: ${contract.endDate ? new Date(contract.endDate).toLocaleDateString('fr-FR') : 'Non spécifiée'}\n` +
            `Renouvellement auto: ${autoRenew}\n` +
            `Notes: ${contract.notes || 'Aucune note'}`
        ).subscribe();
    }

    viewPayments(contract: Contract): void {
        this.router.navigate(['/syndik/payments', contract.uuid]);
        this.toast.info(`Affichage des paiements du contrat ${contract.contractNumber}`);
    }
}