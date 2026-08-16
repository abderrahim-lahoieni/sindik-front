import {Component, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatError, MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {NgIf} from '@angular/common';
import {ButtonComponent} from '../../components/ui/buttons/button.component';
import {InputComponent} from '../../components/ui/Input/input.component';

@Component({
  selector: 'app-add-appartement',
  standalone: true,
  templateUrl: './add-appartement.component.html',
  imports: [
    MatFormField,
    ReactiveFormsModule,
    MatLabel,
    MatIcon,
    MatError,
    MatInput,
    MatButton,
    NgIf,
    ButtonComponent,
    InputComponent,
  ]
})
export class AddAppartementComponent {
  form: FormGroup; // juste la déclaration

  constructor(private fb: FormBuilder) {
    // Initialisation après que fb soit injecté
    this.form = this.fb.group({
      nom: ['', Validators.required],
      etage: ['', Validators.required],
      chambres: ['', Validators.required],
      proprietaire: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.valid) {
      console.log('Appartement ajouté :', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancel() {
    this.form.reset();
  }
  loading = signal(false); // 👈 AJOUT IMPORTANT
}
