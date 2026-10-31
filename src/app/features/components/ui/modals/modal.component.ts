import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  template: `
    <div class="modal-container">

      <!-- Header -->
      <div class="modal-header" *ngIf="title || subtitle || showCloseButton">
        <div class="title-group" *ngIf="title || subtitle">
          <h2 class="modal-title" *ngIf="title">{{ title }}</h2>
          <p class="modal-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <button
          mat-icon-button
          *ngIf="showCloseButton"
          (click)="close()"
          class="close-button"
          aria-label="Fermer la fenêtre"
        >
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body" [class.with-footer]="hasFooter">
        <ng-content></ng-content>
      </div>

      <!-- Footer -->
      <div class="modal-footer" *ngIf="hasFooter">
        <ng-content select="[modal-footer]"></ng-content>
      </div>

    </div>
  `,
  styles: [`

    .modal-container {
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: min(86dvh, 820px);
      min-height: 0;
      overflow: hidden;
      background: #fff;

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex: 0 0 auto;
        padding: 20px 24px;
        border-bottom: 1px solid #e7eeea;
        margin: 0;

        .modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -.02em;
          color: #203b33;
        }

        .modal-subtitle { margin: 5px 0 0; color: #718079; font-size: 12px; line-height: 1.45; }

        .close-button {
          color: #718079;
          transition: color .16s ease, background-color .16s ease;

          &:hover {
            color: #176b57;
            background: #eaf5f1;
          }
        }
      }

      .modal-body {
        flex: 1 1 auto;
        min-height: 0;
        padding: 20px 24px;
        overflow-y: auto;
        overscroll-behavior: contain;

        &.with-footer {
          margin-bottom: 0;
        }

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: #f5f8f6;
        }

        &::-webkit-scrollbar-thumb {
          background: #d5e1da;
          border-radius: 10px;

          &:hover {
            background: #d1d6dd;
          }
        }
      }

      .modal-footer {
        flex: 0 0 auto;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 14px 24px 20px;
        border-top: 1px solid #e7eeea;
        background: #fff;
      }

      @media (max-width: 600px) {
        .modal-header { padding: 16px 18px; }
        .modal-body { padding: 16px 18px; }
        .modal-footer { padding: 12px 18px 16px; gap: 8px; }
      }
    }
  `]
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showCloseButton: boolean = true;
  @Input() hasFooter: boolean = false;

  @Output() modalClose = new EventEmitter<void>();

  private readonly  dialogRef = inject(MatDialogRef<ModalComponent>, { optional: true });

  close(): void {
    this.modalClose.emit();
    this.dialogRef?.close();
  }
}
