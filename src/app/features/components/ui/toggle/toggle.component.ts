import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type ToggleSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true
    }
  ]
})
export class ToggleComponent implements ControlValueAccessor {
  @Input() disabled = false;
  @Input() size: ToggleSize = 'medium';
  @Input() label?: string;

  @Output() checkedChange = new EventEmitter<boolean>();

  checked = false;

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.disabled) return;

    this.checked = !this.checked;

    // Propagation Reactive Forms
    this.onChange(this.checked);
    this.onTouched();

    // Événement externe
    this.checkedChange.emit(this.checked);
  }

  // ---------------- CONTROL VALUE ACCESSOR ----------------
  writeValue(value: boolean): void {
    this.checked = !!value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // ---------------- CLASSES ----------------
  get toggleClasses(): string {
    return [
      'app-toggle',
      `size-${this.size}`,
      this.checked ? 'checked' : '',
      this.disabled ? 'disabled' : ''
    ].filter(Boolean).join(' ');
  }
}
