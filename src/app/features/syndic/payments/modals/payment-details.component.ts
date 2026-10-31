import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import { ModalComponent } from '../../../components/ui/modals/modal.component';
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../access-data/payment.model';

@Component({
  selector: 'app-payment-details-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [title]="'Paiement ' + payment.paymentReference"
      subtitle="Consultez les informations du règlement, son état et son échéancier."
      [showCloseButton]="true"
      [hasFooter]="true">
      <div class="details-content">
        <section class="overview" aria-label="Résumé du paiement">
          <div class="overview-top">
            <div>
              <span class="eyebrow">Montant total</span>
              <strong class="total">{{ money(payment.amount) }} <small>MAD</small></strong>
            </div>
            <span class="status" [ngClass]="'status-' + payment.status.toLowerCase()">
              <span class="status-dot"></span>{{ statusLabel(payment.status) }}
            </span>
          </div>
          <div class="balance-grid">
            <div><span>Réglé</span><strong>{{ money(payment.amountPaid) }} MAD</strong></div>
            <div><span>Reste à payer</span><strong [class.overdue-amount]="payment.isLate && payment.remainingAmount > 0">{{ money(payment.remainingAmount) }} MAD</strong></div>
          </div>
          <div class="balance-track" role="progressbar" aria-label="Montant réglé" aria-valuemin="0" [attr.aria-valuemax]="payment.amount" [attr.aria-valuenow]="payment.amountPaid">
            <span [style.width.%]="paidPercent"></span>
          </div>
          <span class="progress-caption">{{ paidPercent }} % réglé</span>
        </section>

        <section class="details-section">
          <h3><mat-icon aria-hidden="true">person_outline</mat-icon> Bénéficiaire et logement</h3>
          <div class="detail-grid">
            <div class="detail-item"><span>Résident</span><strong>{{ payment.residentName || '—' }}</strong></div>
            <div class="detail-item"><span>Unité</span><strong>{{ payment.unitNumber || '—' }}</strong></div>
            <div class="detail-item"><span>Bâtiment</span><strong>{{ payment.buildingName || '—' }}</strong></div>
            <div class="detail-item"><span>Contrat</span><strong>{{ payment.contractNumber || '—' }}</strong></div>
          </div>
        </section>

        <section class="details-section">
          <h3><mat-icon aria-hidden="true">receipt_long</mat-icon> Détails du règlement</h3>
          <div class="detail-grid">
            <div class="detail-item"><span>Type</span><strong>{{ typeLabel(payment.type) }}</strong></div>
            <div class="detail-item"><span>Moyen de paiement</span><strong>{{ methodLabel(payment.paymentMethod) }}</strong></div>
            <div class="detail-item"><span>Date d’échéance</span><strong>{{ dateLabel(payment.dueDate) }}</strong></div>
            <div class="detail-item"><span>Date de paiement</span><strong>{{ dateLabel(payment.paymentDate) }}</strong></div>
            <div class="detail-item"><span>Période</span><strong>{{ periodLabel }}</strong></div>
            <div class="detail-item"><span>Retard</span><strong [class.overdue-amount]="payment.isLate">{{ payment.isLate ? 'En retard' : 'À jour' }}</strong></div>
            <div class="detail-item"><span>Pénalité</span><strong>{{ money(payment.lateFee) }} MAD</strong></div>
            <div class="detail-item"><span>Remise</span><strong>{{ money(payment.discount) }} MAD</strong></div>
            <div class="detail-item"><span>Récurrent</span><strong>{{ payment.isRecurring ? 'Oui' : 'Non' }}</strong></div>
          </div>
        </section>

        <section class="notes" *ngIf="payment.notes">
          <h3>Notes</h3><p>{{ payment.notes }}</p>
        </section>
        <a *ngIf="payment.receiptUrl" class="receipt-link" [href]="payment.receiptUrl" target="_blank" rel="noopener noreferrer">
          <mat-icon aria-hidden="true">open_in_new</mat-icon> Ouvrir le reçu
        </a>
      </div>

      <div modal-footer class="modal-actions">
        <app-button variant="secondary" (btnClick)="close()">Fermer</app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    :host { display: block; color: #263a32; }
    .details-content { display: grid; gap: 20px; }
    .overview { padding: 18px 20px 14px; border: 1px solid #dce9e2; border-radius: 12px; background: linear-gradient(135deg, #f5faf7, #fff); }
    .overview-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .eyebrow, .balance-grid span, .detail-item span { display: block; color: #718079; font-size: .74rem; }
    .total { display: block; margin-top: 4px; color: #203b33; font-size: 1.7rem; letter-spacing: -.04em; }
    .total small { color: #718079; font-size: .8rem; letter-spacing: 0; }
    .status { display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: 99px; font-size: .73rem; font-weight: 700; white-space: nowrap; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .status-pending, .status-overdue { background: #fff4e5; color: #a65b08; }
    .status-partial { background: #eef2ff; color: #4b58a5; }
    .status-paid { background: #e8f5ee; color: #176b57; }
    .status-cancelled { background: #f1f3f2; color: #68746e; }
    .balance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0 10px; }
    .balance-grid strong { display: block; margin-top: 4px; color: #334a40; font-size: .88rem; }
    .balance-track { height: 6px; overflow: hidden; border-radius: 99px; background: #e5eee8; }
    .balance-track span { display: block; height: 100%; border-radius: inherit; background: #23836a; transition: width .2s ease; }
    .progress-caption { display: block; margin-top: 6px; color: #718079; font-size: .68rem; text-align: right; }
    .details-section h3, .notes h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; color: #35584b; font-size: .78rem; font-weight: 700; }
    .details-section h3 mat-icon { width: 18px; height: 18px; color: #23836a; font-size: 18px; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid #e7eeea; border-radius: 10px; background: #e7eeea; }
    .detail-item { min-width: 0; padding: 11px 13px; background: #fff; }
    .detail-item strong { display: block; overflow-wrap: anywhere; margin-top: 4px; color: #263a32; font-size: .82rem; font-weight: 600; }
    .overdue-amount { color: #b54743 !important; }
    .notes { padding: 14px; border-radius: 10px; background: #f7f9f8; }
    .notes h3 { margin-bottom: 6px; }
    .notes p { margin: 0; color: #53645b; font-size: .82rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
    .receipt-link { display: inline-flex; align-items: center; gap: 7px; width: fit-content; color: #176b57; font-size: .82rem; font-weight: 650; text-decoration: none; }
    .receipt-link mat-icon { width: 18px; height: 18px; font-size: 18px; }
    .receipt-link:hover { text-decoration: underline; }
    .modal-actions { width: 100%; display: flex; justify-content: flex-end; }
    @media (max-width: 560px) { .details-content { gap: 16px; }.overview { padding: 14px; }.total { font-size: 1.45rem; }.detail-grid { grid-template-columns: 1fr; }.balance-grid { gap: 8px; } }
  `]
})
export class PaymentDetailsModalComponent {
  readonly payment = inject<{ payment: Payment }>(MAT_DIALOG_DATA).payment;
  private readonly dialogRef = inject(MatDialogRef<PaymentDetailsModalComponent>);

  get paidPercent(): number {
    return this.payment.amount > 0 ? Math.min(100, Math.max(0, Math.round(this.payment.amountPaid / this.payment.amount * 100))) : 0;
  }

  get periodLabel(): string {
    if (!this.payment.periodStart && !this.payment.periodEnd) return '—';
    if (!this.payment.periodStart) return `Jusqu’au ${this.dateLabel(this.payment.periodEnd)}`;
    if (!this.payment.periodEnd) return `À partir du ${this.dateLabel(this.payment.periodStart)}`;
    return `${this.dateLabel(this.payment.periodStart)} – ${this.dateLabel(this.payment.periodEnd)}`;
  }

  money(value?: number | null): string { return Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }); }
  dateLabel(value?: Date | string | null): string { return value ? new Date(value).toLocaleDateString('fr-FR') : '—'; }

  statusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'En attente', [PaymentStatus.PARTIAL]: 'Partiel', [PaymentStatus.PAID]: 'Payé',
      [PaymentStatus.OVERDUE]: 'En retard', [PaymentStatus.CANCELLED]: 'Annulé'
    };
    return labels[status] || status;
  }

  typeLabel(type: PaymentType): string {
    const labels: Record<PaymentType, string> = {
      [PaymentType.RENT]: 'Loyer', [PaymentType.DEPOSIT]: 'Caution', [PaymentType.MAINTENANCE_FEE]: 'Entretien',
      [PaymentType.UTILITY]: 'Charges', [PaymentType.PARKING]: 'Parking', [PaymentType.LATE_FEE]: 'Pénalité',
      [PaymentType.OTHER]: 'Autre'
    };
    return labels[type] || type;
  }

  methodLabel(method?: PaymentMethod): string {
    if (!method) return 'Non renseigné';
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'Espèces', [PaymentMethod.BANK_TRANSFER]: 'Virement bancaire', [PaymentMethod.CHECK]: 'Chèque',
      [PaymentMethod.CREDIT_CARD]: 'Carte bancaire', [PaymentMethod.DEBIT_CARD]: 'Carte de débit',
      [PaymentMethod.MOBILE_PAYMENT]: 'Paiement mobile', [PaymentMethod.OTHER]: 'Autre'
    };
    return labels[method] || method;
  }

  close(): void { this.dialogRef.close(); }
}
