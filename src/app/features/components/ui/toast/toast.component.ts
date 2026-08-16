import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'delete';
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="custom-toast" [ngStyle]="getStyle()">
      <mat-icon class="toast-icon">{{ getIcon() }}</mat-icon>
      <span class="toast-message">{{ data.message }}</span>
      <button mat-icon-button class="toast-close" (click)="dismiss()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    /* ===== Container du toast ===== */
    .custom-toast {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      min-width: 250px;
      max-width: 90vw;       /* pour éviter scrollbar */
      color: white;
      font-weight: 500;
      box-sizing: border-box;
    }

    /* ===== Icon ===== */
    .toast-icon { flex-shrink: 0; }

    /* ===== Message ===== */
    .toast-message { flex: 1; }

    /* ===== Bouton fermer ===== */
    .toast-close {
      color: white;
      opacity: 0.8;
      transition: opacity 0.2s ease;
    }
    .toast-close:hover { opacity: 1; }

    /* ===== Décalage pour éviter scrollbar ===== */
    ::ng-deep .transparent-snackbar {
      right: 16px !important;  /* décale vers la gauche */
      top: 16px !important;    /* un peu de marge du haut */
    }
  `]
})
export class ToastComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: ToastData,
    private readonly snackBarRef: MatSnackBarRef<ToastComponent>
  ) {}

  getIcon(): string {
    switch (this.data.type) {
      case 'success': return 'check_circle';
      case 'delete': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
    }
  }

  getStyle(): any {
    switch (this.data.type) {
      case 'success': return { background: '#2ecc71' };
      case 'delete': return { background: '#ff4757' };
      case 'error': return { background: '#ff4757' };
      case 'warning': return { background: '#f39c12' };
      case 'info': return { background: '#3498db' };
      default: return { background: '#333' };
    }
  }

  dismiss(): void { 
    this.snackBarRef.dismiss();
   }
}