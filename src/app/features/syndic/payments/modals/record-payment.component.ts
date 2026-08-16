// src/app/features/syndic/payments/modals/record-payment.component.ts

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentService } from '../access-data/payment.service';
import { ModalComponent } from '../../../components/ui/modals/modal.component';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import { InputComponent } from '../../../components/ui/Input/input.component';
import ToastService from '../../../components/ui/toast/toast.service';
import { Payment, PaymentMethod, PaymentUpdateRequest } from '../access-data/payment.model';

@Component({
  selector: 'app-record-payment-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    ModalComponent
  ],
  template: `
    <app-modal
      [title]="'Enregistrer paiement - ' + payment.paymentReference"
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <form [formGroup]="form" (ngSubmit)="submit()">
        
        <!-- Info Paiement -->
        <div class="payment-info">
          <div class="info-row">
            <span class="info-label">Résident:</span>
            <span class="info-value">{{ payment.residentName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Montant total:</span>
            <span class="info-value">{{ payment.amount.toLocaleString('fr-FR') }} MAD</span>
          </div>
          <div class="info-row">
            <span class="info-label">Déjà payé:</span>
            <span class="info-value">{{ payment.amountPaid.toLocaleString('fr-FR') }} MAD</span>
          </div>
          <div class="info-row">
            <span class="info-label">Restant:</span>
            <span class="info-value amount-remaining">{{ payment.remainingAmount.toLocaleString('fr-FR') }} MAD</span>
          </div>
        </div>

        <!-- Montant à payer -->
        <div class="form-group">
          <label class="form-label">Montant à enregistrer <span class="required">*</span></label>
          <input
            type="number"
            formControlName="amount"
            class="form-input"
            [max]="payment.remainingAmount"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
          <span *ngIf="amountError" class="error-text">{{ amountError }}</span>
        </div>

        <!-- Méthode de paiement -->
        <div class="form-group">
          <label class="form-label">Méthode de paiement</label>
          <select formControlName="paymentMethod" class="form-select">
            <option *ngFor="let opt of paymentMethodOptions" [value]="opt.value">
              {{ opt.label }}
            </option>
          </select>
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
          Enregistrer
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    .payment-info {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #e2e8f0;

        &:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
        }

        .info-value {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;

          &.amount-remaining {
            color: #ff4757;
            font-size: 1.125rem;
          }
        }
      }
    }

    .form-group {
      margin-bottom: 1.5rem;
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
    }

    .form-textarea {
      resize: vertical;
    }

    .error-text {
      display: block;
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;
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
export class RecordPaymentModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly toast = inject(ToastService);
  protected readonly dialogRef = inject(MatDialogRef<RecordPaymentModalComponent>);
  private readonly modalData = inject<{ payment: Payment }>(MAT_DIALOG_DATA);

  loading = signal(false);
  payment: Payment;

  form = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: [''],
    notes: [''],
    receiptUrl: ['']
  });

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

  constructor() {
    this.payment = this.modalData.payment;
    
    // Définir le montant restant par défaut
    this.form.patchValue({
      amount: this.payment.remainingAmount
    });

    // Validation personnalisée pour le montant
    this.form.get('amount')?.setValidators([
      Validators.required,
      Validators.min(0.01),
      Validators.max(this.payment.remainingAmount)
    ]);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Veuillez remplir correctement le formulaire');
      return;
    }

    this.loading.set(true);

    const formValue = this.form.value;
    const amount = formValue.amount || 0;

    const request: PaymentUpdateRequest = {
      paymentMethod: formValue.paymentMethod as PaymentMethod || undefined,
      notes: formValue.notes || undefined,
      receiptUrl: formValue.receiptUrl || undefined
    };

    this.paymentService.recordPayment(this.payment.uuid, amount, request).subscribe({
      next: (response) => {
        this.toast.success('Paiement enregistré avec succès');
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur enregistrement:', err);
        this.toast.error(err.error?.error || 'Erreur lors de l\'enregistrement');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  get amountError(): string {
    const control = this.form.get('amount');
    if (control?.hasError('required') && control?.touched) {
      return 'Montant requis';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'Le montant doit être supérieur à 0';
    }
    if (control?.hasError('max') && control?.touched) {
      return `Le montant ne peut pas dépasser ${this.payment.remainingAmount.toLocaleString('fr-FR')} MAD`;
    }
    return '';
  }
}