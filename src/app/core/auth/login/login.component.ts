// login.component.ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';

import { AuthService } from '../auth.service';
import { Role } from '../models/auth.model';
import ToastService from '../../../features/components/ui/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {

  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);

  readonly error = signal<string | null>(null);
  hidePassword   = true;

  readonly form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(event?: Event): void {
    event?.preventDefault();
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.toast.success('Connecté avec succès !');
        this.auth.startAutoLogout(res.expiresIn);
        this.redirectByRole(res.role);
      },
      error: () => this.error.set('Identifiants invalides. Veuillez réessayer.')
    });
  }

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  private redirectByRole(role: Role): void {
    const map: Record<Role, string> = {
      ADMIN:    '/admin',
      SYNDIC:   '/syndik',
      RESIDENT: '/resident'
    };
    this.router.navigate([map[role]]);
  }
}