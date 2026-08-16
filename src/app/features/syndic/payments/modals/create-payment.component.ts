// src/app/features/syndic/payments/modals/create-payment.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { PaymentService } from '../access-data/payment.service';
import { ContractService } from '../../contracts/access-data/contract.service';
import { SyndicBuildingService } from '../../access-data/syndic-building.service';
import { ModalComponent } from '../../../components/ui/modals/modal.component';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import { InputComponent } from '../../../components/ui/Input/input.component';
import { ToggleComponent } from '../../../components/ui/toggle/toggle.component';
import { AuthService } from '../../../../core/auth/auth.service';
import ToastService from '../../../components/ui/toast/toast.service';
import { PaymentType, PaymentStatus, PaymentMethod } from '../access-data/payment.model';
import { Contract } from '../../contracts/access-data/contract.model';

@Component({
  selector: 'app-create-payment-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    ModalComponent,
    ToggleComponent
  ],
  template: `
    <app-modal
      title="Créer un nouveau paiement"
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <form [formGroup]="form" (ngSubmit)="submit()">
        
        <!-- Section Contrat -->
        <div class="section-title">Sélection du contrat</div>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Bâtiment -->
          <div class="form-group">
            <label class="form-label">Bâtiment <span class="required">*</span></label>
            <select 
              formControlName="buildingUuid" 
              class="form-select"
              (change)="onBuildingChange($any($event.target).value)">
              <option value="">Sélectionnez un bâtiment</option>
              <option *ngFor="let opt of buildingOptions()" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Contrat -->
          <div class="form-group">
            <label class="form-label">Contrat <span class="required">*</span></label>
            <select 
              formControlName="contractUuid" 
              class="form-select"
              [disabled]="loadingContracts() || contractOptions().length === 0"
              (change)="onContractChange($any($event.target).value)">
              <option value="">Sélectionnez un contrat</option>
              <option *ngFor="let opt of contractOptions()" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <div *ngIf="loadingContracts()" class="loading-text">Chargement...</div>
            <span *ngIf="contractError" class="error-text">{{ contractError }}</span>
          </div>
        </div>

        <!-- Affichage infos contrat sélectionné -->
        <div *ngIf="selectedContract()" class="contract-info">
          <div class="info-row">
            <span class="info-label">Résident:</span>
            <span class="info-value">{{ selectedContract()?.residentName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Unité:</span>
            <span class="info-value">{{ selectedContract()?.unitNumber }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Loyer mensuel:</span>
            <span class="info-value">{{ selectedContract()?.monthlyRent?.toLocaleString('fr-FR') }} MAD</span>
          </div>
        </div>

        <!-- Section Paiement -->
        <div class="section-title">Détails du paiement</div>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Type -->
          <div class="form-group">
            <label class="form-label">Type de paiement <span class="required">*</span></label>
            <select formControlName="type" class="form-select">
              <option *ngFor="let opt of paymentTypeOptions" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Statut -->
          <div class="form-group">
            <label class="form-label">Statut <span class="required">*</span></label>
            <select formControlName="status" class="form-select">
              <option *ngFor="let opt of paymentStatusOptions" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Montants -->
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Montant (MAD) <span class="required">*</span></label>
            <input
              type="number"
              formControlName="amount"
              class="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            <span *ngIf="amountError" class="error-text">{{ amountError }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Montant payé (MAD)</label>
            <input
              type="number"
              formControlName="amountPaid"
              class="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div class="date-field">
            <label class="date-label">Date d'échéance <span class="required">*</span></label>
            <input 
              type="date" 
              formControlName="dueDate" 
              class="date-input"
            />
            <span *ngIf="dueDateError" class="error-text">{{ dueDateError }}</span>
          </div>

          <div class="date-field">
            <label class="date-label">Date de paiement</label>
            <input 
              type="date" 
              formControlName="paymentDate" 
              class="date-input"
            />
          </div>
        </div>

        <!-- Période -->
        <div class="grid grid-cols-2 gap-4">
          <div class="date-field">
            <label class="date-label">Période - Début</label>
            <input 
              type="date" 
              formControlName="periodStart" 
              class="date-input"
            />
          </div>

          <div class="date-field">
            <label class="date-label">Période - Fin</label>
            <input 
              type="date" 
              formControlName="periodEnd" 
              class="date-input"
            />
          </div>
        </div>

        <!-- Section Supplémentaire -->
        <div class="section-title">Informations supplémentaires</div>

        <div class="grid grid-cols-3 gap-4">
          <!-- Méthode de paiement -->
          <div class="form-group">
            <label class="form-label">Méthode de paiement</label>
            <select formControlName="paymentMethod" class="form-select">
              <option *ngFor="let opt of paymentMethodOptions" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Pénalité de retard -->
          <div class="form-group">
            <label class="form-label">Pénalité (MAD)</label>
            <input
              type="number"
              formControlName="lateFee"
              class="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <!-- Remise -->
          <div class="form-group">
            <label class="form-label">Remise (MAD)</label>
            <input
              type="number"
              formControlName="discount"
              class="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <!-- Toggle récurrent -->
        <div class="toggle-field">
          <label class="toggle-label">Paiement récurrent</label>
          <app-toggle formControlName="isRecurring"></app-toggle>
        </div>

        <!-- URL Reçu -->
        <div class="form-group">
          <label class="form-label">URL du reçu</label>
          <input
            type="url"
            formControlName="receiptUrl"
            class="form-input"
            placeholder="https://..."
          />
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea
            formControlName="notes"
            class="form-textarea"
            rows="3"
            placeholder="Notes sur le paiement..."
          ></textarea>
        </div>

      </form>

      <!-- Footer -->
      <div modal-footer class="flex justify-end gap-2">
        <app-button
          size="medium"
          (btnClick)="cancel()">
          Annuler
        </app-button>
        <app-button
          variant="primary"
          size="medium"
          [loading]="loading()"
          type="submit"
          [disabled]="form.invalid || loading()"
          (btnClick)="submit()">
          Créer le paiement
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    .section-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 1.5rem 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #ffc312;
    }

    .grid {
      display: grid;
    }

    .grid-cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    .grid-cols-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    .gap-4 {
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;

      .required {
        color: #ef4444;
        margin-left: 2px;
      }
    }

    .form-input,
    .form-select,
    .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: 'Poppins', sans-serif;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #ffc312;
        box-shadow: 0 0 0 3px rgba(255, 195, 18, 0.1);
      }

      &:disabled {
        background: #f9fafb;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .form-textarea {
      resize: vertical;
    }

    .date-field {
      margin-bottom: 1rem;

      .date-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;

        .required {
          color: #ef4444;
          margin-left: 2px;
        }
      }

      .date-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-family: 'Poppins', sans-serif;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #ffc312;
          box-shadow: 0 0 0 3px rgba(255, 195, 18, 0.1);
        }
      }
    }

    .toggle-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: #f9fafb;
      margin-bottom: 1rem;

      .toggle-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin: 0;
      }
    }

    .contract-info {
      background: #f0f9ff;
      border: 2px solid #bae6fd;
      border-radius: 12px;
      padding: 1rem;
      margin: 1rem 0;

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #e0f2fe;

        &:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0c4a6e;
        }

        .info-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: #075985;
        }
      }
    }

    .error-text {
      display: block;
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .loading-text {
      color: #ffc312;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .flex {
      display: flex;
    }

    .justify-end {
      justify-content: flex-end;
    }

    .gap-2 {
      gap: 0.5rem;
    }
  `]
})
export class CreatePaymentModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly contractService = inject(ContractService);
  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly dialogRef = inject(MatDialogRef<CreatePaymentModalComponent>);

  loading = signal(false);
  loadingContracts = signal(false);
  
  buildingOptions = signal<{ value: string; label: string }[]>([]);
  contractOptions = signal<{ value: string; label: string }[]>([]);
  selectedContract = signal<Contract | null>(null);

  form = this.fb.group({
    buildingUuid: ['', Validators.required],
    contractUuid: ['', Validators.required],
    residentUuid: [''],
    type: [PaymentType.RENT, Validators.required],
    status: [PaymentStatus.PENDING, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    amountPaid: [0],
    dueDate: ['', Validators.required],
    paymentDate: [''],
    paymentMethod: [''],
    periodStart: [''],
    periodEnd: [''],
    lateFee: [0],
    discount: [0],
    notes: [''],
    receiptUrl: [''],
    isRecurring: [false]
  });

  paymentTypeOptions = [
    { value: PaymentType.RENT, label: 'Loyer' },
    { value: PaymentType.DEPOSIT, label: 'Caution' },
    { value: PaymentType.MAINTENANCE_FEE, label: 'Frais d\'entretien' },
    { value: PaymentType.UTILITY, label: 'Charges' },
    { value: PaymentType.PARKING, label: 'Parking' },
    { value: PaymentType.LATE_FEE, label: 'Pénalité de retard' },
    { value: PaymentType.OTHER, label: 'Autre' }
  ];

  paymentStatusOptions = [
    { value: PaymentStatus.PENDING, label: 'En attente' },
    { value: PaymentStatus.PAID, label: 'Payé' },
    { value: PaymentStatus.PARTIAL, label: 'Partiellement payé' }
  ];

  paymentMethodOptions = [
    { value: '', label: 'Sélectionnez une méthode' },
    { value: PaymentMethod.CASH, label: 'Espèces' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Virement bancaire' },
    { value: PaymentMethod.CHECK, label: 'Chèque' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Carte de crédit' },
    { value: PaymentMethod.DEBIT_CARD, label: 'Carte de débit' },
    { value: PaymentMethod.MOBILE_PAYMENT, label: 'Paiement mobile' },
    { value: PaymentMethod.OTHER, label: 'Autre' }
  ];

  ngOnInit(): void {
    this.loadMyBuildings();
  }

  private loadMyBuildings(): void {
    const currentUserUuid = this.auth.getUsernameUUid();
    if (!currentUserUuid) return;

    this.syndicBuildingService.getBuildingsBySyndic(currentUserUuid).subscribe({
      next: (buildings) => {
        const options = buildings.map(b => ({ 
          value: b.buildingUuid, 
          label: b.buildingName 
        }));
        this.buildingOptions.set(options);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement de vos bâtiments');
      }
    });
  }

  onBuildingChange(buildingUuid: string): void {
    console.log('Bâtiment sélectionné:', buildingUuid);

    if (!buildingUuid) {
      this.contractOptions.set([]);
      this.selectedContract.set(null);
      this.form.patchValue({ contractUuid: '' });
      return;
    }

    this.form.patchValue({ contractUuid: '' });
    this.selectedContract.set(null);
    this.loadingContracts.set(true);

    this.contractService.getContracts({ buildingUuid, isActive: true }).subscribe({
      next: (contracts) => {
        const options = contracts.map(c => ({ 
          value: c.uuid, 
          label: `${c.contractNumber} - ${c.residentName} (${c.unitNumber})`
        }));
        this.contractOptions.set(options);
        this.loadingContracts.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des contrats');
        this.contractOptions.set([]);
        this.loadingContracts.set(false);
      }
    });
  }

  onContractChange(contractUuid: string): void {
    console.log('Contrat sélectionné:', contractUuid);

    if (!contractUuid) {
      this.selectedContract.set(null);
      return;
    }

    this.contractService.getContractByUuid(contractUuid).subscribe({
      next: (contract) => {
        this.selectedContract.set(contract);
        
        // Pré-remplir certains champs
        this.form.patchValue({
          residentUuid: contract.residentUuid,
          amount: contract.monthlyRent
        });
      },
      error: () => {
        this.toast.error('Erreur lors du chargement du contrat');
        this.selectedContract.set(null);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.loading.set(true);

    const formValue = this.form.value;
    const request: any = {
      contractUuid: formValue.contractUuid,
      residentUuid: formValue.residentUuid || this.selectedContract()?.residentUuid,
      type: formValue.type,
      status: formValue.status,
      amount: formValue.amount,
      amountPaid: formValue.amountPaid || 0,
      dueDate: formValue.dueDate,
      paymentDate: formValue.paymentDate || null,
      paymentMethod: formValue.paymentMethod || null,
      periodStart: formValue.periodStart || null,
      periodEnd: formValue.periodEnd || null,
      lateFee: formValue.lateFee || 0,
      discount: formValue.discount || 0,
      notes: formValue.notes || null,
      receiptUrl: formValue.receiptUrl || null,
      isRecurring: formValue.isRecurring || false
    };

    console.log('Request payload:', request);

    this.paymentService.createPayment(request).subscribe({
      next: (response) => {
        console.log('Paiement créé:', response);
        this.toast.success('Paiement créé avec succès');
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur création:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la création');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  get contractError(): string {
    const control = this.form.get('contractUuid');
    if (control?.hasError('required') && control?.touched) {
      return 'Contrat requis';
    }
    return '';
  }

  get amountError(): string {
    const control = this.form.get('amount');
    if (control?.hasError('required') && control?.touched) {
      return 'Montant requis';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'Le montant doit être supérieur à 0';
    }
    return '';
  }

  get dueDateError(): string {
    const control = this.form.get('dueDate');
    if (control?.hasError('required') && control?.touched) {
      return 'Date d\'échéance requise';
    }
    return '';
  }
}