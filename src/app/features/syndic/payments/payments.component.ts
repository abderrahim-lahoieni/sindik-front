// src/app/features/syndic/payments/payments.component.ts

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { PaymentService } from './access-data/payment.service';
import { SyndicBuildingService } from '../access-data/syndic-building.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ModalService } from '../../components/ui/modals/modal.service';
import ToastService from '../../components/ui/toast/toast.service';
import { TableComponent, TableColumn, TableAction } from '../../components/ui/tables/table.component';
import { ButtonComponent } from '../../components/ui/buttons/button.component';
import { Payment, PaymentFilters, PaymentStatus, PaymentType } from './access-data/payment.model';
import { RecordPaymentModalComponent } from './modals/record-payment.component';
import { CreatePaymentModalComponent } from './modals/create-payment.component';
@Component({
    selector: 'app-syndic-payments',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TableComponent,
        ButtonComponent
    ],
    templateUrl: './payments.component.html',
    styleUrls: ['./payments.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SyndicPaymentsComponent implements OnInit {
    private readonly paymentService = inject(PaymentService);
    private readonly syndicBuildingService = inject(SyndicBuildingService);
    private readonly auth = inject(AuthService);
    private readonly modal = inject(ModalService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);

    payments = signal<Payment[]>([]);
    loading = signal(true);
    buildingOptions = signal<{ value: string; label: string }[]>([]);

    // Stats calculées
    totalAmount = signal(0);
    totalPaid = signal(0);
    totalPending = signal(0);
    overdueCount = signal(0);

    searchForm = this.fb.group({
        buildingUuid: [''],
        type: [''],
        status: ['']
    });

    private readonly refreshSubject = new Subject<void>();
    private readonly searchSubject = new Subject<PaymentFilters>();

    columns: TableColumn[] = [
        { key: 'paymentReference', label: 'Référence', sortable: true, width: '140px' },
        { key: 'residentName', label: 'Résident', sortable: true, width: '180px' },
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
            width: '130px',
            format: (value: PaymentType) => {
                const labels: Record<PaymentType, string> = {
                    [PaymentType.RENT]: 'Loyer',
                    [PaymentType.DEPOSIT]: 'Caution',
                    [PaymentType.MAINTENANCE_FEE]: 'Entretien',
                    [PaymentType.UTILITY]: 'Charges',
                    [PaymentType.PARKING]: 'Parking',
                    [PaymentType.LATE_FEE]: 'Pénalité',
                    [PaymentType.OTHER]: 'Autre'
                };
                return `<span class="badge badge-type">${labels[value]}</span>`;
            }
        },
        {
            key: 'status',
            label: 'Statut',
            width: '120px',
            align: 'center',
            format: (value: PaymentStatus, row: Payment) => {
                const config: Record<PaymentStatus, { label: string; class: string }> = {
                    [PaymentStatus.PENDING]: { label: 'En attente', class: 'badge-pending' },
                    [PaymentStatus.PARTIAL]: { label: 'Partiel', class: 'badge-partial' },
                    [PaymentStatus.PAID]: { label: 'Payé', class: 'badge-paid' },
                    [PaymentStatus.OVERDUE]: { label: 'En retard', class: 'badge-overdue' },
                    [PaymentStatus.CANCELLED]: { label: 'Annulé', class: 'badge-cancelled' }
                };
                const badge = `<span class="badge ${config[value].class}">${config[value].label}</span>`;
                const late = row.isLate ? '<span class="late-indicator">⚠️</span>' : '';
                return badge + late;
            }
        },
        {
            key: 'amount',
            label: 'Montant',
            sortable: true,
            width: '120px',
            align: 'right',
            format: (value: number) => `${value.toLocaleString('fr-FR')} MAD`
        },
        {
            key: 'amountPaid',
            label: 'Payé',
            sortable: true,
            width: '120px',
            align: 'right',
            format: (value: number) => `${value.toLocaleString('fr-FR')} MAD`
        },
        {
            key: 'remainingAmount',
            label: 'Restant',
            sortable: true,
            width: '120px',
            align: 'right',
            format: (value: number) => {
                const color = value > 0 ? 'text-danger' : 'text-success';
                return `<span class="${color} font-weight-bold">${value.toLocaleString('fr-FR')} MAD</span>`;
            }
        },
        {
            key: 'dueDate',
            label: 'Date échéance',
            sortable: true,
            width: '120px',
            format: (value: Date) => new Date(value).toLocaleDateString('fr-FR')
        }
    ];

    actions: TableAction[] = [
        {
            icon: 'payment',
            label: 'Enregistrer paiement',
            callback: (row: Payment) => this.recordPayment(row),
            hidden: (row: Payment) => row.status === PaymentStatus.PAID || row.status === PaymentStatus.CANCELLED
        },
        {
            icon: 'visibility',
            label: 'Voir détails',
            callback: (row: Payment) => this.viewDetails(row)
        },
        {
            icon: 'receipt',
            label: 'Voir reçu',
            callback: (row: Payment) => this.viewReceipt(row),
            hidden: (row: Payment) => !row.receiptUrl
        }
    ];

    paymentTypeOptions = [
        { value: '', label: 'Tous les types' },
        { value: PaymentType.RENT, label: 'Loyer' },
        { value: PaymentType.DEPOSIT, label: 'Caution' },
        { value: PaymentType.MAINTENANCE_FEE, label: 'Entretien' },
        { value: PaymentType.UTILITY, label: 'Charges' },
        { value: PaymentType.PARKING, label: 'Parking' },
        { value: PaymentType.LATE_FEE, label: 'Pénalité' },
        { value: PaymentType.OTHER, label: 'Autre' }
    ];

    paymentStatusOptions = [
        { value: '', label: 'Tous les statuts' },
        { value: PaymentStatus.PENDING, label: 'En attente' },
        { value: PaymentStatus.PARTIAL, label: 'Partiel' },
        { value: PaymentStatus.PAID, label: 'Payé' },
        { value: PaymentStatus.OVERDUE, label: 'En retard' },
        { value: PaymentStatus.CANCELLED, label: 'Annulé' }
    ];
    private route = inject(ActivatedRoute);
    contractUuid!: string;
    ngOnInit(): void {
        this.contractUuid = this.route.snapshot.paramMap.get('contractUuid')!;
        this.loadMyBuildings();
        this.setupSearch();
        this.loadPayments();
    }
    loadPaymentsByContract() {
        this.paymentService
            .getPaymentsByContract(this.contractUuid)
            .subscribe(payments => {
                this.payments.set(payments);
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
                    type: filters.type as PaymentType || undefined,
                    status: filters.status as PaymentStatus || undefined
                });
            });

        merge(
            this.searchSubject.pipe(
                tap(() => this.loading.set(true)),
                switchMap(filters => this.fetchPayments(filters))
            ),
            this.refreshSubject.pipe(
                tap(() => this.loading.set(true)),
                switchMap(() => this.fetchPayments())
            )
        ).subscribe({
            next: (payments) => {
                this.payments.set(payments);
                this.calculateStats(payments);
                this.loading.set(false);
            },
            error: () => {
                this.toast.error('Erreur lors du chargement des paiements');
                this.loading.set(false);
            }
        });
    }

    private fetchPayments(filters?: PaymentFilters) {

    if (this.contractUuid) {
        return this.paymentService.getPaymentsByContract(this.contractUuid);
    }

    return this.paymentService.getPayments(filters);
}

    private calculateStats(payments: Payment[]): void {
        const total = payments.reduce((sum, p) => sum + p.amount, 0);
        const paid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        const pending = payments.reduce((sum, p) => sum + p.remainingAmount, 0);
        const overdue = payments.filter(p => p.isLate).length;

        this.totalAmount.set(total);
        this.totalPaid.set(paid);
        this.totalPending.set(pending);
        this.overdueCount.set(overdue);
    }

    loadPayments(): void {
        this.refreshSubject.next();
    }

    openCreateModal(): void {
        this.modal.open(CreatePaymentModalComponent, {
            width: '800px',
            data: { mode: 'create' }
        }).afterClosed().subscribe((result: Payment) => {
            if (result) {
                this.loadPayments();
            }
        });
    }

    recordPayment(payment: Payment): void {
        this.modal.open(RecordPaymentModalComponent, {
            width: '600px',
            data: { payment }
        }).afterClosed().subscribe((result: Payment) => {
            if (result) {
                this.loadPayments();
                this.toast.success('Paiement enregistré avec succès');
            }
        });
    }

    viewDetails(payment: Payment): void {
        const paymentDateStr = payment.paymentDate
            ? new Date(payment.paymentDate).toLocaleDateString('fr-FR')
            : 'Non payé';

        this.modal.alert(
            `Détails du paiement\n\n` +
            `Référence: ${payment.paymentReference}\n` +
            `Contrat: ${payment.contractNumber}\n` +
            `Résident: ${payment.residentName}\n` +
            `Unité: ${payment.unitNumber} - ${payment.buildingName}\n` +
            `Type: ${payment.type}\n` +
            `Statut: ${payment.status}\n` +
            `Montant: ${payment.amount.toLocaleString('fr-FR')} MAD\n` +
            `Payé: ${payment.amountPaid.toLocaleString('fr-FR')} MAD\n` +
            `Restant: ${payment.remainingAmount.toLocaleString('fr-FR')} MAD\n` +
            `Date échéance: ${new Date(payment.dueDate).toLocaleDateString('fr-FR')}\n` +
            `Date paiement: ${paymentDateStr}\n` +
            `En retard: ${payment.isLate ? 'Oui ⚠️' : 'Non'}\n` +
            `Notes: ${payment.notes || 'Aucune note'}`
        ).subscribe();
    }

    viewReceipt(payment: Payment): void {
        if (payment.receiptUrl) {
            window.open(payment.receiptUrl, '_blank');
        }
    }
}