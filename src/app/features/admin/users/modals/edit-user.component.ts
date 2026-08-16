import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import { UserService } from '../access-data/user.service';
import ToastService from '../../../components/ui/toast/toast.service';
import { Role } from '../../../../core/auth/models/auth.model';
import { ModalComponent } from '../../../components/ui/modals/modal.component';
import { User } from '../access-data/user.model';
import { AuthService } from '../../../../core/auth/auth.service';
import {ToggleComponent} from '../../../components/ui/toggle/toggle.component';
import { InputComponent} from '../../../components/ui/Input/input.component';

@Component({
  selector: 'app-edit-user-modal',
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
    ModalComponent,
    ToggleComponent
  ],
  template: `
    <app-modal
      [title]="'Modifier un utilisateur'"
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
        <app-input
          label="Rôle"
          type="select"
          icon="admin_panel_settings"
          [required]="true"
          [control]="form.get('role')!"
          [options]="availableRoles"
        ></app-input>
        <!-- Mot de passe-->
          <div class="mb-6 p-4">
            <div class="flex items-center justify-between gap-4 mb-4">
              <span class="font-bold text-gray-800">Changer le mot de passe</span>
              <app-toggle
                formControlName="changePassword"
                (checkedChange)="onChangePasswordToggle($event)">
              </app-toggle>
            </div>


          <ng-container *ngIf="form.get('changePassword')?.value">
            <app-input
              label="Nouveau mot de passe"
              type="password"
              placeholder="********"
              icon="lock"
              [required]="true"
              [control]="form.get('password')!"
              [errorMessage]="passwordError"
            ></app-input>

            <app-input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="********"
              icon="lock"
              [required]="true"
              [control]="form.get('confirmPassword')!"
              [errorMessage]="confirmPasswordError"
            ></app-input>
          </ng-container>
        </div>
      </form>

      <!-- Footer -->
      <div modal-footer class="flex justify-end gap-2">
        <app-button
          variant="primary"
          size="medium"
          [loading]="loading()"
          (btnClick)="submit()"
          type="submit"
          [disabled]="form.invalid || loading() || !hasChanges()"
        >
          Modifier
        </app-button>
      </div>
    </app-modal>
  `,
})
export class EditUserModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly dialogRef = inject(MatDialogRef<EditUserModalComponent>);
  private readonly modalData = inject<{ user: User }>(MAT_DIALOG_DATA);

  @Output() userUpdated = new EventEmitter<User>();

  loading = signal(false);
  user: User;

  availableRoles = this.getAvailableRoles();

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: [Role.R, Validators.required],
    isActive: [true],
    isAccountNonLocked: [true],
    changePassword: [false],
    password: [''],
    confirmPassword: ['']
  });

  constructor() {
    this.user = this.modalData.user;
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form.patchValue({
      fullName: this.user.fullName,
      email: this.user.email,
      role: this.user.role,
      isActive: this.user.isActive,
      isAccountNonLocked: this.user.isAccountNonLocked,
      changePassword: false
    });
  }

  private getAvailableRoles(): { value: Role; label: string; disabled?: boolean }[] {
    const currentUserRole = this.auth.getRole();
    const allRoles = [
      { value: Role.A, label: 'Admin' },
      { value: Role.S, label: 'Syndic' },
      { value: Role.R, label: 'Résident' }
    ];

    switch (currentUserRole) {
      case Role.A:
        return allRoles;
      case Role.S:
        return allRoles.filter(r => r.value !== Role.A);
      default:
        return allRoles.map(r => ({ ...r, disabled: r.value !== this.user.role }));
    }
  }

  onChangePasswordToggle(checked: boolean): void {
    const passwordControl = this.form.get('password');
    const confirmControl = this.form.get('confirmPassword');

    if (checked) {
      passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
      confirmControl?.setValidators([Validators.required]);
    } else {
      passwordControl?.clearValidators();
      confirmControl?.clearValidators();
      passwordControl?.setValue('');
      confirmControl?.setValue('');
    }

    passwordControl?.updateValueAndValidity();
    confirmControl?.updateValueAndValidity();
  }

  hasChanges(): null | undefined | boolean {
    const formValue = this.form.value;
    const hasBasicChanges =
      formValue.fullName !== this.user.fullName ||
      formValue.email !== this.user.email ||
      formValue.role !== this.user.role ||
      formValue.isActive !== this.user.isActive ||
      formValue.isAccountNonLocked !== this.user.isAccountNonLocked;

    const hasPasswordChange = formValue.changePassword && !!formValue.password;

    return hasBasicChanges || hasPasswordChange;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Veuillez corriger les erreurs du formulaire');
      return;
    }

    if (this.form.get('changePassword')?.value) {
      const password = this.form.get('password')?.value;
      const confirm = this.form.get('confirmPassword')?.value;
      if (password !== confirm) {
        this.toast.warning('Les mots de passe ne correspondent pas');
        return;
      }
    }

    this.loading.set(true);

    const formValue = this.form.value;

    const updateRequest: any = {
      fullName: formValue.fullName,
      email: formValue.email,
      role: formValue.role?.toUpperCase(), // <-- Assure le mapping avec le backend
      isActive: formValue.isActive,
      isAccountNonLocked: formValue.isAccountNonLocked
    };

    if (formValue.changePassword && formValue.password) {
      updateRequest.password = formValue.password;
    }

    this.userService.updateUser(this.user.uuid, updateRequest).subscribe({
      next: (response) => {
        this.toast.success('Utilisateur modifié avec succès');
        this.userUpdated.emit(response);
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la modification');
        this.loading.set(false);
      }
    });
  }

  // Getters d’erreurs
  get fullNameError(): string {
    const c = this.form.get('fullName');
    if (c?.hasError('required') && c?.touched) return 'Nom requis';
    return '';
  }

  get emailError(): string {
    const c = this.form.get('email');
    if (c?.hasError('required') && c?.touched) return 'Email requis';
    if (c?.hasError('email') && c?.touched) return 'Email invalide';
    return '';
  }

  get passwordError(): string {
    const c = this.form.get('password');
    if (c?.hasError('required') && c?.touched) return 'Mot de passe requis';
    if (c?.hasError('minlength') && c?.touched) return 'Minimum 6 caractères';
    return '';
  }

  get confirmPasswordError(): string {
    const c = this.form.get('confirmPassword');
    const password = this.form.get('password')?.value;
    if (c?.hasError('required') && c?.touched) return 'Confirmation requise';
    if (c?.touched && password !== c?.value) return 'Les mots de passe ne correspondent pas';
    return '';
  }
}
