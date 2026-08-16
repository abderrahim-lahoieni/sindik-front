// src/app/components/ui/Input/input.component.ts

import {Component, Input, forwardRef, signal, OnInit, EventEmitter, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'select';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor, OnInit {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: InputType = 'text';
  @Input() icon?: string;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() errorMessage: string = '';
  @Input() helperText: string = '';
  @Input() maxLength?: number;
  @Input() control?: AbstractControl | null;

  // Inputs pour le select
  @Input() options: SelectOption[] = [];
  @Input() multiple: boolean = false;
  @Output() selectChange = new EventEmitter<any>(); // AJOUTER


  value = signal<any>('');
  hidePassword = signal<boolean>(true);
  isFocused = signal<boolean>(false);



  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    // Ne pas remplacer par '' si la valeur est null/undefined seulement
    this.value.set(value ?? '');
  }

  ngOnInit() {
    if (this.control) {
      // Sync valeur
      this.value.set(this.control.value ?? '');

      this.control.valueChanges.subscribe(value => {
        this.value.set(value ?? '');
      });

      // 🔥 IMPORTANT : Sync disabled
      this.disabled = this.control.disabled;

      this.control.statusChanges.subscribe(() => {
        this.disabled = this.control?.disabled ?? false;
      });
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = this.type === 'number' ? target.valueAsNumber : target.value;

    this.value.set(newValue);
    this.onChange(newValue);
    this.onTouched();

    if (this.control && this.control instanceof FormControl) {
      this.control.markAsTouched();
      this.control.setValue(newValue, { emitEvent: false });
    }
  }

  // Méthode pour le select
  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    let newValue: any;

    if (this.multiple) {
      const selectedOptions = Array.from(target.selectedOptions);
      newValue = selectedOptions.map(option => option.value);
    } else {
      newValue = target.value;
    }

    this.value.set(newValue);
    this.onChange(newValue);
    this.onTouched();

    // ÉMETTRE l'événement
    this.selectChange.emit(newValue);

    if (this.control && this.control instanceof FormControl) {
      this.control.markAsTouched();
      this.control.setValue(newValue, { emitEvent: true }); // IMPORTANT: emitEvent: true
    }
  }
  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();

    if (this.control) {
      this.control.markAsTouched();
      this.control.updateValueAndValidity();
    }
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  get inputType(): string {
    if (this.type === 'password') {
      return this.hidePassword() ? 'password' : 'text';
    }
    return this.type;
  }

  get hasError(): boolean {
    if (this.errorMessage) return true;

    if (this.control) {
      return this.control.invalid && this.control.touched;
    }

    return false;
  }

  get displayError(): string {
    if (this.errorMessage) return this.errorMessage;

    if (this.control?.errors && this.control?.touched) {
      const errors = this.control.errors;
      if (errors['required']) return 'Ce champ est obligatoire';
      if (errors['email']) return 'Email invalide';
      if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
      if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} caractères`;
      if (errors['pattern']) return 'Format invalide';
    }

    return '';
  }

  get characterCount(): string {
    if (!this.maxLength) return '';
    const length = typeof this.value() === 'string' ? this.value().length : 0;
    return `${length}/${this.maxLength}`;
  }

  get isSelect(): boolean {
    return this.type === 'select';
  }
}
