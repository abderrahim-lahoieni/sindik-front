import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';
export type IconPosition = 'left' | 'right';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatRippleModule, MatProgressSpinnerModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon?: string;
  @Input() iconPosition: IconPosition = 'left';
  @Input() fullWidth: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() btnClick = new EventEmitter<Event>();

  onClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.btnClick.emit(event);
    }
  }

  get buttonClasses(): string {
    return [
      'app-button',
      `variant-${this.variant}`,
      `size-${this.size}`,
      this.disabled ? 'disabled' : '',
      this.loading ? 'loading' : '',
      this.fullWidth ? 'full-width' : ''
    ].filter(Boolean).join(' ');
  }
}
