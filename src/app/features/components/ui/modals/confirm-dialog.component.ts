import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';

export type DialogType = 'info' | 'success' | 'warning' | 'danger';

export interface ConfirmDialogData {
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    A11yModule
  ],
  template: `
    <div
      class="confirm-dialog"
      [ngClass]="'type-' + dialogType"
    >
      <!-- ICON -->
      <div class="dialog-icon">
        <mat-icon>{{ getIcon() }}</mat-icon>
      </div>

      <!-- CONTENT -->
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <p mat-dialog-content>{{ data.message }}</p>

      <!-- ACTIONS -->
      <div mat-dialog-actions align="center" class="dialog-actions">
        <button
          mat-stroked-button
          *ngIf="data.showCancel !== false"
          (click)="onCancel()"
          class="btn-cancel"
        >
          {{ data.cancelText || 'Annuler' }}
        </button>

        <button
          mat-raised-button
          cdkFocusInitial
          (click)="onConfirm()"
          [ngClass]="'btn-confirm btn-' + dialogType"
        >
          {{ data.confirmText || 'Confirmer' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      font-family: 'Poppins', sans-serif;
      text-align: center;
      padding: 24px;
    }

    .dialog-icon {
      margin-bottom: 16px;
    }

    .dialog-icon mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    h2 {
      margin: 0 0 12px;
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: #8896ab;
      line-height: 1.6;
    }

    .dialog-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 24px;
    }

    button {
      min-width: 110px;
      height: 40px;
      border-radius: 8px;
      font-weight: 500;
    }

    .btn-cancel {
      color: #6b7a90;
      border-color: #e1e8ed;
    }

    /* ICON COLORS */
    .type-info mat-icon { color: #3498db; }
    .type-success mat-icon { color: #2ecc71; }
    .type-warning mat-icon { color: #f39c12; }
    .type-danger mat-icon { color: #ff4757; }

    /* CONFIRM BUTTONS */
    .btn-info { background: #3498db; color: #fff; }
    .btn-success { background: #2ecc71; color: #fff; }
    .btn-warning { background: #f39c12; color: #fff; }
    .btn-danger { background: #ff4757; color: #fff; }
  `]
})
export class ConfirmDialogComponent {

  dialogType: DialogType = 'info';

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    this.dialogType = data.type ?? 'info';
  }

  getIcon(): string {
    switch (this.dialogType) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'danger': return 'error';
      default: return 'info';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
