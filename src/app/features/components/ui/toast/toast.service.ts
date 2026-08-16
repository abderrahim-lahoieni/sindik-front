import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastComponent, ToastData } from './toast.component';

export type ToastType = 'success' | 'delete' | 'warning' | 'info' | 'error';

@Injectable({ providedIn: 'root' })
export default class ToastService {
  constructor(private readonly snackBar: MatSnackBar) {}

  private show(message: string, type: ToastType, duration: number = 3000) {
    const data: ToastData = { message, type };

    this.snackBar.openFromComponent(ToastComponent, {
      data,
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['transparent-snackbar'], // on cible le container
      politeness: 'polite',
      announcementMessage: message,
    });
  }

  success(message: string, duration?: number) { this.show(message, 'success', duration); }
  delete(message: string, duration?: number) { this.show(message, 'delete', duration); }
  error(message: string, duration?: number) { this.show(message, 'error', duration); }
  warning(message: string, duration?: number) { this.show(message, 'warning', duration); }
  info(message: string, duration?: number) { this.show(message, 'info', duration); }
}