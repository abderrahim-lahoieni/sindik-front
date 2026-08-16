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
      <div class="modal-header" *ngIf="title || showCloseButton">
        <h2 class="modal-title" *ngIf="title">{{ title }}</h2>
        <button
          mat-icon-button
          *ngIf="showCloseButton"
          (click)="close()"
          class="close-button"
        >
          <mat-icon>close</mat-icon>
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
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    .modal-container {
      font-family: 'Poppins', sans-serif;
      display: flex;
      flex-direction: column;
      max-height: 90vh;

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 24px 0 24px;
        border-bottom: 1px solid #e1e8ed;
        padding-bottom: 16px;
        margin-bottom: 24px;

        .modal-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #2c3e50;
        }

        .close-button {
          color: #8896ab;
          transition: all 0.3s ease;

          &:hover {
            color: #ffc312;
            background: rgba(255, 195, 18, 0.1);
          }
        }
      }

      .modal-body {
        flex: 1;
        padding: 0 24px;
        overflow-y: auto;

        &.with-footer {
          margin-bottom: 24px;
        }

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: #f5f6fa;
        }

        &::-webkit-scrollbar-thumb {
          background: #e1e8ed;
          border-radius: 10px;

          &:hover {
            background: #d1d6dd;
          }
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px 24px 24px;
        border-top: 1px solid #e1e8ed;
      }
    }
  `]
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() showCloseButton: boolean = true;
  @Input() hasFooter: boolean = false;

  @Output() modalClose = new EventEmitter<void>();

  private readonly  dialogRef = inject(MatDialogRef<ModalComponent>, { optional: true });

  close(): void {
    this.modalClose.emit();
    this.dialogRef?.close();
  }
}
