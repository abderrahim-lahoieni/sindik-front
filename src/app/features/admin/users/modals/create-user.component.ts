// src/app/features/admin/users/create-user-modal.component.ts

import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogRef } from '@angular/material/dialog';

// Vos composants
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import { InputComponent } from '../../../components/ui/Input/input.component';
import { UserService } from '../access-data/user.service';
import ToastService from '../../../components/ui/toast/toast.service';
import { Role } from '../../../../core/auth/models/auth.model';
import {ModalComponent} from '../../../components/ui/modals/modal.component';

@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    ButtonComponent,
    InputComponent,
    ModalComponent
  ],
  template: `
    <app-modal
      title="Ajouter un utilisateur"
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <form [formGroup]="form" (ngSubmit)="submit()">
        <!-- Nom complet -->
        <app-input
          label="Nom complet"
          placeholder="Jean Dupont"
          icon="person"
          [required]="true"
          [control]="form.get('fullName')!"
          [errorMessage]="fullNameError"
        ></app-input>

        <!-- Email -->
        <app-input
          label="Email"
          type="email"
          placeholder="email@exemple.com"
          icon="email"
          [required]="true"
          [control]="form.get('email')!"
          [errorMessage]="emailError"
        ></app-input>

        <!-- Mot de passe -->
        <app-input
          label="Mot de passe"
          type="password"
          placeholder="********"
          icon="lock"
          [required]="true"
          [control]="form.get('password')!"
          [errorMessage]="passwordError"
        ></app-input>

        <!-- Rôle -->
        <app-input
          label="Rôle"
          type="select"
          icon="admin_panel_settings"
          [required]="true"
          [control]="form.get('role')!"
          [options]="roles"
        ></app-input>

      </form>
       <!-- Footer avec les boutons -->
        <div modal-footer>
          <app-button
            variant="primary"
            size="medium"
            [loading]="loading()"
            type="submit"
            [disabled]="form.invalid || loading()"
            (btnClick)="submit()"
          >
            Ajouter
          </app-button>
        </div>
    </app-modal>
  `
})
export class CreateUserModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<CreateUserModalComponent>);

  @Output() userCreated = new EventEmitter<any>();

  loading = signal(false);

  roles = [
    { value: Role.A, label: 'Admin' },
    { value: Role.S, label: 'Syndic' },
    { value: Role.R, label: 'Resident' }
  ];

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: [Role.R, Validators.required],
    isActive: [true]
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Veuillez remplir tous les champs');
      return;
    }

    this.loading.set(true);

    this.userService.createUser(this.form.value as any).subscribe({
      next: (response) => {
        this.toast.success('Utilisateur créé avec succès');
        this.userCreated.emit(response);
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur création:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la création');
        this.loading.set(false);
      }
    });
  }
  // Getters pour les erreurs
  get fullNameError(): string {
    const control = this.form.get('fullName');
    if (control?.hasError('required') && control?.touched) {
      return 'Nom requis';
    }
    return '';
  }

  get emailError(): string {
    const control = this.form.get('email');
    if (control?.hasError('required') && control?.touched) {
      return 'Email requis';
    }
    if (control?.hasError('email') && control?.touched) {
      return 'Email invalide';
    }
    return '';
  }

  get passwordError(): string {
    const control = this.form.get('password');
    if (control?.hasError('required') && control?.touched) {
      return 'Mot de passe requis';
    }
    return '';
  }
}
