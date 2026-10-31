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
      subtitle="Sélectionnez un contrat, puis renseignez les détails du règlement."
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <form [formGroup]="form" (ngSubmit)="onFormSubmit()">

        <div class="wizard-progress" aria-label="Progression du formulaire">
          <div class="wizard-progress-heading"><span>Étape {{ currentStep() }} sur {{ totalSteps }}</span><strong>{{ stepLabels[currentStep() - 1] }}</strong></div>
          <div class="wizard-track" role="progressbar" aria-label="Progression du formulaire" aria-valuemin="1" [attr.aria-valuemax]="totalSteps" [attr.aria-valuenow]="currentStep()"><span [style.width.%]="(currentStep() / totalSteps) * 100"></span></div>
          <div class="wizard-steps" aria-hidden="true"><span *ngFor="let label of stepLabels; let i = index" [class.active]="currentStep() === i + 1" [class.complete]="currentStep() > i + 1">{{ label }}</span></div>
        </div>
        
        <!-- Section Contrat -->
        <section class="wizard-step" *ngIf="currentStep() === 1" aria-label="Sélection du contrat">
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
        </section>

        <!-- Section Paiement -->
        <section class="wizard-step" *ngIf="currentStep() === 2" aria-label="Détails du paiement">
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
        </section>

        <section class="wizard-step" *ngIf="currentStep() === 3" aria-label="Dates et modalités">
        <div class="section-title">Dates et modalités</div>
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
        </section>

        <section class="wizard-step" *ngIf="currentStep() === 4" aria-label="Informations complémentaires">
        <!-- Section Supplémentaire -->
        <div class="section-title">Informations complémentaires</div>
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
        </section>

      </form>

      <!-- Footer -->
      <div modal-footer class="modal-actions">
        <div class="actions-left">
          <app-button *ngIf="currentStep() === 1" size="medium" variant="ghost" (btnClick)="cancel()">Annuler</app-button>
          <app-button *ngIf="currentStep() > 1" size="medium" variant="secondary" icon="arrow_back" (btnClick)="previousStep()">Précédent</app-button>
        </div>
        <app-button *ngIf="currentStep() < totalSteps" size="medium" variant="primary" icon="arrow_forward" iconPosition="right" [disabled]="loadingContracts()" (btnClick)="nextStep()">Continuer</app-button>
        <app-button *ngIf="currentStep() === totalSteps" variant="primary" size="medium" icon="check" [loading]="loading()" [disabled]="form.invalid || loading()" (btnClick)="submit()">Créer le paiement</app-button>
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
      border-bottom: 2px solid #176b57;
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
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #176b57;
        box-shadow: 0 0 0 3px rgba(23, 107, 87, 0.1);
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
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #176b57;
          box-shadow: 0 0 0 3px rgba(23, 107, 87, 0.1);
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
      color: #176b57;
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

    .wizard-progress { margin: 0 0 1.2rem; padding-bottom: 1rem; border-bottom: 1px solid #e8eeea; }
    .wizard-progress-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 9px; color: #7a8981; font-size: .72rem; }
    .wizard-progress-heading strong { color: #176b57; font-size: .78rem; font-weight: 700; }
    .wizard-track { height: 5px; overflow: hidden; border-radius: 99px; background: #eaf0ec; }
    .wizard-track span { display: block; height: 100%; border-radius: inherit; background: #23836a; transition: width .2s ease; }
    .wizard-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
    .wizard-steps span { overflow: hidden; color: #94a099; font-size: .62rem; font-weight: 600; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
    .wizard-steps span.active, .wizard-steps span.complete { color: #176b57; }
    .wizard-step { min-height: 200px; animation: step-in .18s ease-out; }
    @keyframes step-in { from { opacity: .65; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .modal-actions { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 10px; }
    .actions-left { display: flex; align-items: center; }
    .section-title { margin: .4rem 0 .9rem; padding-bottom: .55rem; border-bottom: 1px solid #e4ebe7; color: #35584b; font-size: .74rem; letter-spacing: .08em; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .gap-4 { gap: .85rem; }
    .form-group, .date-field { min-width: 0; margin-bottom: .8rem; }
    .form-label, .date-label { color: #43564d; font-size: .8rem; margin-bottom: .4rem; }
    .form-input, .form-select, .form-textarea, .date-input { box-sizing: border-box; min-height: 42px; padding: .65rem .75rem; border: 1px solid #d7e1db; border-radius: 8px; background: #fff; color: #203b33; font-size: .85rem; transition: border-color .16s ease, box-shadow .16s ease; }
    .form-input:focus, .form-select:focus, .form-textarea:focus, .date-input:focus { border-color: #176b57; box-shadow: 0 0 0 3px rgba(23,107,87,.12); }
    .form-textarea { min-height: 88px; line-height: 1.5; }
    .toggle-field { min-height: 44px; padding: .65rem .8rem; border: 1px solid #e4ebe7; border-radius: 8px; background: #f8faf9; }
    .toggle-field .toggle-label { color: #43564d; font-size: .82rem; font-weight: 600; }
    .contract-info { padding: .75rem 1rem; border: 1px solid #dce9e2; border-radius: 10px; background: #f5faf7; }
    .contract-info .info-row { padding: .45rem 0; border-color: #e4eee8; }
    .contract-info .info-label { color: #718079; font-size: .78rem; }
    .contract-info .info-value { color: #263a32; font-size: .82rem; }

    @media (max-width: 600px) {
      .wizard-steps { display: none; }
      .wizard-step { min-height: 0; }
      .grid-cols-2, .grid-cols-3 { grid-template-columns: 1fr; }
      .modal-actions { gap: 6px; }
      .actions-left, .modal-actions > app-button { flex: 1; }
      .modal-actions app-button { width: 100%; }
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
  currentStep = signal(1);
  readonly totalSteps = 4;
  readonly stepLabels = ['Contrat', 'Montants', 'Échéances', 'Compléments'];
  private readonly stepFields = [
    ['buildingUuid', 'contractUuid'],
    ['type', 'status', 'amount'],
    ['dueDate'],
    []
  ];
  
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

  nextStep(): void {
    const fields = this.stepFields[this.currentStep() - 1] || [];
    const invalidFields = fields.filter(name => {
      const control = this.form.get(name);
      control?.markAsTouched();
      return control?.invalid;
    });

    if (invalidFields.length) {
      this.toast.warning('Veuillez compléter les champs obligatoires de cette étape');
      return;
    }

    if (this.currentStep() < this.totalSteps) this.currentStep.update(step => step + 1);
  }

  previousStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(step => step - 1);
  }

  onFormSubmit(): void {
    if (this.currentStep() < this.totalSteps) {
      this.nextStep();
      return;
    }
    this.submit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalidStep = this.stepFields.findIndex(fields => fields.some(name => this.form.get(name)?.invalid));
      if (firstInvalidStep >= 0) this.currentStep.set(firstInvalidStep + 1);
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
