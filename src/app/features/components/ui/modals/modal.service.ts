import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

export interface ModalConfig {
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  disableClose?: boolean;
  panelClass?: string | string[];
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private readonly dialog = inject(MatDialog);

  /**
   * Ouvre un modal générique
   */
  open<T, R = any>(
    component: ComponentType<T>,
    config?: ModalConfig
  ): MatDialogRef<T, R> {
    return this.dialog.open(component, {
      width: config?.width || '600px',
      maxWidth: config?.maxWidth || '90vw',
      height: config?.height,
      maxHeight: config?.maxHeight || '90vh',
      disableClose: config?.disableClose ?? false,
      panelClass: ['custom-modal', ...(Array.isArray(config?.panelClass) ? config.panelClass : config?.panelClass ? [config.panelClass] : [])],
      data: config?.data,
      autoFocus: true,
      restoreFocus: true
    });
  }

  /**
   * Ouvre un modal de confirmation
   */
  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'custom-modal',
      data
    });

    return dialogRef.afterClosed();
  }

  /**
   * Ouvre un modal d'alerte (seulement OK)
   */
  alert(message: string, title: string = 'Information'): Observable<boolean> {
    return this.confirm({
      title,
      message,
      type: 'info',
      confirmText: 'OK',
      showCancel: false
    });
  }

  /**
   * Ouvre un modal de suppression
   */
  confirmDelete(itemName?: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirmer la suppression',
      message: itemName
        ? `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`
        : 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
      type: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });
  }
}
