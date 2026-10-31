// src/app/features/syndic/contracts/modals/edit-contract.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ContractService } from '../access-data/contract.service';
import { ResidentService } from '../../../admin/residents/access-data/resident.service';
import { UnitService } from '../../../admin/units/access-data/unit.service';
import { SyndicBuildingService } from '../../access-data/syndic-building.service';
import { ModalComponent } from '../../../components/ui/modals/modal.component';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import { InputComponent } from '../../../components/ui/Input/input.component';
import { ToggleComponent } from '../../../components/ui/toggle/toggle.component';
import { AuthService } from '../../../../core/auth/auth.service';
import ToastService from '../../../components/ui/toast/toast.service';
import { Contract, ContractType, ContractStatus, PaymentFrequency } from '../access-data/contract.model';
import { ModalService } from '../../../components/ui/modals/modal.service';

@Component({
  selector: 'app-edit-contract-modal',
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
      [title]="'Modifier le contrat ' + contract.contractNumber"
      subtitle="Mettez à jour les informations et les conditions du contrat."
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <form [formGroup]="form" (ngSubmit)="onFormSubmit()">

        <div class="wizard-progress" aria-label="Progression du formulaire">
          <div class="wizard-progress-heading">
            <span>Étape {{ currentStep() }} sur {{ totalSteps }}</span>
            <strong>{{ stepLabels[currentStep() - 1] }}</strong>
          </div>
          <div class="wizard-track" role="progressbar" aria-label="Progression du formulaire" aria-valuemin="1" [attr.aria-valuemax]="totalSteps" [attr.aria-valuenow]="currentStep()">
            <span [style.width.%]="(currentStep() / totalSteps) * 100"></span>
          </div>
          <div class="wizard-steps" aria-hidden="true">
            <span *ngFor="let label of stepLabels; let i = index" [class.active]="currentStep() === i + 1" [class.complete]="currentStep() > i + 1">{{ label }}</span>
          </div>
        </div>
        
        <!-- Info contrat -->
        <section class="wizard-step" *ngIf="currentStep() === 1" aria-label="Informations du contrat">
        <div class="contract-info-header">
          <div class="info-item">
            <span class="info-label">Résident:</span>
            <span class="info-value">{{ contract.residentName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Unité:</span>
            <span class="info-value">{{ contract.unitNumber }} - {{ contract.buildingName }}</span>
          </div>
        </div>

        <!-- Type et Statut -->
        <div class="section-title">Informations du contrat</div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Type de contrat</label>
            <select formControlName="type" class="form-select">
              <option *ngFor="let opt of contractTypeOptions" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Statut</label>
            <select formControlName="status" class="form-select">
              <option *ngFor="let opt of contractStatusOptions" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
        </section>

        <!-- Dates -->
        <section class="wizard-step" *ngIf="currentStep() === 2" aria-label="Période du contrat">
        <div class="section-title">Période du contrat</div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="date-field">
            <label class="date-label">Date de début</label>
            <input 
              type="date" 
              formControlName="startDate" 
              class="date-input"
            />
          </div>

          <div class="date-field">
            <label class="date-label">Date de fin</label>
            <input 
              type="date" 
              formControlName="endDate" 
              class="date-input"
            />
          </div>
        </div>
        </section>

        <!-- Financier -->
        <section class="wizard-step" *ngIf="currentStep() === 3" aria-label="Conditions financières">
        <div class="section-title">Informations financières</div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Loyer mensuel (MAD)</label>
            <input
              type="number"
              formControlName="monthlyRent"
              class="form-input"
              step="0.01"
              min="0"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Caution (MAD)</label>
            <input
              type="number"
              formControlName="depositAmount"
              class="form-input"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Fréquence de paiement</label>
            <select formControlName="paymentFrequency" class="form-select">
              <option *ngFor="let opt of paymentFrequencyOptions" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Jour de paiement (1-31)</label>
            <input
              type="number"
              formControlName="paymentDay"
              class="form-input"
              min="1"
              max="31"
            />
          </div>
        </div>

        <div class="toggle-field">
          <label class="toggle-label">Caution payée</label>
          <app-toggle formControlName="depositPaid"></app-toggle>
        </div>
        </section>

        <!-- Options -->
        <section class="wizard-step" *ngIf="currentStep() === 4" aria-label="Options du contrat">
        <div class="section-title">Options</div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Délai de préavis (jours)</label>
            <input
              type="number"
              formControlName="renewalNoticeDays"
              class="form-input"
              min="0"
            />
          </div>

          <div class="toggle-field">
            <label class="toggle-label">Renouvellement automatique</label>
            <app-toggle formControlName="autoRenewable"></app-toggle>
          </div>
        </div>

        <!-- Termes -->
        <div class="form-group">
          <label class="form-label">Termes et conditions</label>
          <textarea
            formControlName="terms"
            class="form-textarea"
            rows="4"
          ></textarea>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea
            formControlName="notes"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>

        <!-- Toggle Actif -->
        <div class="toggle-field">
          <label class="toggle-label">Contrat actif</label>
          <app-toggle formControlName="isActive"></app-toggle>
        </div>
        </section>

      </form>

      <!-- Footer -->
      <div modal-footer class="modal-actions">
        <div class="actions-left">
          <app-button variant="danger" size="small" icon="delete_outline" (btnClick)="confirmDelete()">Supprimer</app-button>
        </div>
        <div class="actions-right">
          <app-button *ngIf="currentStep() === 1" size="medium" variant="ghost" (btnClick)="cancel()">Annuler</app-button>
          <app-button *ngIf="currentStep() > 1" size="medium" variant="secondary" icon="arrow_back" (btnClick)="previousStep()">Précédent</app-button>
          <app-button *ngIf="currentStep() < totalSteps" size="medium" variant="primary" icon="arrow_forward" iconPosition="right" (btnClick)="nextStep()">Continuer</app-button>
          <app-button *ngIf="currentStep() === totalSteps" variant="primary" size="medium" icon="save" [loading]="loading()" [disabled]="!hasChanges() || loading()" (btnClick)="submit()">Enregistrer</app-button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .wizard-progress { margin: 0 0 1.2rem; padding-bottom: 1rem; border-bottom: 1px solid #e8eeea; }
    .wizard-progress-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 9px; color: #7a8981; font-size: .72rem; }
    .wizard-progress-heading strong { color: #176b57; font-size: .78rem; font-weight: 700; }
    .wizard-track { height: 5px; overflow: hidden; border-radius: 99px; background: #eaf0ec; }
    .wizard-track span { display: block; height: 100%; border-radius: inherit; background: #23836a; transition: width .2s ease; }
    .wizard-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
    .wizard-steps span { overflow: hidden; color: #94a099; font-size: .62rem; font-weight: 600; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
    .wizard-steps span.active, .wizard-steps span.complete { color: #176b57; }
    .wizard-step { min-height: 205px; animation: step-in .18s ease-out; }
    @keyframes step-in { from { opacity: .65; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .modal-actions { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 10px; }
    .actions-left, .actions-right { display: flex; align-items: center; gap: 8px; }

    .contract-info-header {
      background: #f5faf7;
      border: 1px solid #dce9e2;
      border-radius: 10px;
      padding: 0.8rem 1rem;
      margin-bottom: 1.2rem;

      .info-item {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 0.55rem 0;
        border-bottom: 1px solid #e4eee8;

        &:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #718079;
        }

        .info-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: #263a32;
        }
      }
    }

    .section-title {
      font-size: 0.74rem;
      font-weight: 700;
      color: #35584b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 1.35rem 0 0.85rem;
      padding-bottom: 0.55rem;
      border-bottom: 1px solid #e4ebe7;
    }

    .grid {
      display: grid;
    }

    .grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .gap-4 {
      gap: 0.9rem;
    }

    .form-group {
      min-width: 0;
      margin-bottom: 0.85rem;
    }

    .form-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #43564d;
      margin-bottom: 0.4rem;
    }

    .form-input,
    .form-select,
    .form-textarea {
      width: 100%;
      box-sizing: border-box;
      min-height: 42px;
      padding: 0.65rem 0.75rem;
      border: 1px solid #d7e1db;
      border-radius: 8px;
      background: #fff;
      color: #203b33;
      font-size: 0.85rem;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      transition: border-color .16s ease, box-shadow .16s ease;

      &:focus {
        outline: none;
        border-color: #176b57;
        box-shadow: 0 0 0 3px rgba(23, 107, 87, 0.12);
      }
    }

    .form-textarea {
      resize: vertical;
      min-height: 88px;
      line-height: 1.5;
    }

    .date-field {
      margin-bottom: 1rem;

      .date-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .date-input {
        width: 100%;
        box-sizing: border-box;
        min-height: 42px;
        padding: 0.65rem 0.75rem;
        border: 1px solid #d7e1db;
        border-radius: 8px;
        background: #fff;
        color: #203b33;
        font-size: 0.85rem;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        transition: border-color .16s ease, box-shadow .16s ease;

        &:focus {
          outline: none;
          border-color: #176b57;
          box-shadow: 0 0 0 3px rgba(23, 107, 87, 0.12);
        }
      }
    }

    .toggle-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 44px;
      padding: 0.65rem 0.8rem;
      border: 1px solid #e4ebe7;
      border-radius: 8px;
      background: #f8faf9;
      margin-bottom: 0.85rem;

      .toggle-label {
        font-size: 0.82rem;
        font-weight: 600;
        color: #43564d;
        margin: 0;
      }
    }

    .flex {
      display: flex;
    }

    .justify-between {
      justify-content: space-between;
    }

    .gap-2 {
      gap: 0.5rem;
    }

    @media (max-width: 600px) {
      .wizard-steps { display: none; }
      .wizard-step { min-height: 0; }
      .grid-cols-2 { grid-template-columns: 1fr; }
      .toggle-field { grid-column: 1 / -1; }
      .modal-actions { align-items: stretch; }
      .actions-left { flex: 0 0 auto; }
      .actions-right { justify-content: flex-end; flex-wrap: wrap; }
      .modal-actions app-button { flex: 0 1 auto; }
    }
  `]
})
export class EditContractModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);
  private readonly toast = inject(ToastService);
  private readonly modal = inject(ModalService);
  protected readonly dialogRef = inject(MatDialogRef<EditContractModalComponent>);
  private readonly modalData = inject<{ contract: Contract }>(MAT_DIALOG_DATA);

  loading = signal(false);
  currentStep = signal(1);
  readonly totalSteps = 4;
  readonly stepLabels = ['Informations', 'Période', 'Finances', 'Options'];
  contract: Contract;
  initialFormValue: any;

  form = this.fb.group({
    type: [''],
    status: [''],
    startDate: [''],
    endDate: [''],
    monthlyRent: [0],
    depositAmount: [0],
    depositPaid: [false],
    paymentFrequency: [''],
    paymentDay: [1],
    renewalNoticeDays: [0],
    autoRenewable: [false],
    terms: [''],
    notes: [''],
    isActive: [true]
  });

  contractTypeOptions = [
    { value: ContractType.RENTAL, label: 'Location' },
    { value: ContractType.OWNERSHIP, label: 'Propriété' },
    { value: ContractType.SUBLEASE, label: 'Sous-location' },
    { value: ContractType.COMMERCIAL, label: 'Commercial' },
    { value: ContractType.PARKING, label: 'Parking' },
    { value: ContractType.STORAGE, label: 'Stockage' }
  ];

  contractStatusOptions = [
    { value: ContractStatus.DRAFT, label: 'Brouillon' },
    { value: ContractStatus.ACTIVE, label: 'Actif' },
    { value: ContractStatus.PENDING, label: 'En attente' },
    { value: ContractStatus.EXPIRED, label: 'Expiré' },
    { value: ContractStatus.TERMINATED, label: 'Résilié' },
    { value: ContractStatus.RENEWED, label: 'Renouvelé' }
  ];

  paymentFrequencyOptions = [
    { value: PaymentFrequency.MONTHLY, label: 'Mensuel' },
    { value: PaymentFrequency.QUARTERLY, label: 'Trimestriel' },
    { value: PaymentFrequency.SEMI_ANNUAL, label: 'Semestriel' },
    { value: PaymentFrequency.ANNUAL, label: 'Annuel' }
  ];

  constructor() {
    this.contract = this.modalData.contract;
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const startDate = this.contract.startDate 
      ? new Date(this.contract.startDate).toISOString().split('T')[0]
      : '';
    
    const endDate = this.contract.endDate 
      ? new Date(this.contract.endDate).toISOString().split('T')[0]
      : '';

    this.form.patchValue({
      type: this.contract.type,
      status: this.contract.status,
      startDate,
      endDate,
      monthlyRent: this.contract.monthlyRent,
      depositAmount: this.contract.depositAmount || 0,
      depositPaid: this.contract.depositPaid,
      paymentFrequency: this.contract.paymentFrequency,
      paymentDay: this.contract.paymentDay || 1,
      renewalNoticeDays: this.contract.renewalNoticeDays || 0,
      autoRenewable: this.contract.autoRenewable,
      terms: this.contract.terms || '',
      notes: this.contract.notes || '',
      isActive: this.contract.isActive
    });

    this.initialFormValue = this.form.value;
  }

  hasChanges(): boolean {
    return JSON.stringify(this.form.value) !== JSON.stringify(this.initialFormValue);
  }

  nextStep(): void {
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
    if (!this.hasChanges()) {
      this.toast.info('Aucune modification détectée');
      return;
    }

    this.loading.set(true);

    const formValue = this.form.value;
    const request: any = {};

    // Seulement envoyer les champs modifiés
    if (formValue.type !== this.initialFormValue.type) request.type = formValue.type;
    if (formValue.status !== this.initialFormValue.status) request.status = formValue.status;
    if (formValue.startDate !== this.initialFormValue.startDate) request.startDate = formValue.startDate;
    if (formValue.endDate !== this.initialFormValue.endDate) request.endDate = formValue.endDate || null;
    if (formValue.monthlyRent !== this.initialFormValue.monthlyRent) request.monthlyRent = formValue.monthlyRent;
    if (formValue.depositAmount !== this.initialFormValue.depositAmount) request.depositAmount = formValue.depositAmount;
    if (formValue.depositPaid !== this.initialFormValue.depositPaid) request.depositPaid = formValue.depositPaid;
    if (formValue.paymentFrequency !== this.initialFormValue.paymentFrequency) request.paymentFrequency = formValue.paymentFrequency;
    if (formValue.paymentDay !== this.initialFormValue.paymentDay) request.paymentDay = formValue.paymentDay;
    if (formValue.renewalNoticeDays !== this.initialFormValue.renewalNoticeDays) request.renewalNoticeDays = formValue.renewalNoticeDays;
    if (formValue.autoRenewable !== this.initialFormValue.autoRenewable) request.autoRenewable = formValue.autoRenewable;
    if (formValue.terms !== this.initialFormValue.terms) request.terms = formValue.terms || null;
    if (formValue.notes !== this.initialFormValue.notes) request.notes = formValue.notes || null;
    if (formValue.isActive !== this.initialFormValue.isActive) request.isActive = formValue.isActive;

    this.contractService.updateContract(this.contract.uuid, request).subscribe({
      next: (response) => {
        this.toast.success('Contrat modifié avec succès');
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la modification');
        this.loading.set(false);
      }
    });
  }

  confirmDelete(): void {

  this.modal.confirmDelete(this.contract.contractNumber)
    .subscribe((confirmed: boolean) => {

      if (!confirmed) return;

      this.contractService.deleteContract(this.contract.uuid).subscribe({
        next: () => {
          this.toast.success('Contrat supprimé avec succès');
          this.dialogRef.close({ deleted: true });
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.toast.error(err.error?.error || 'Erreur lors de la suppression');
        }
      });

    });

}

  cancel(): void {
    this.dialogRef.close();
  }
}
