// src/app/features/admin/residences/modals/edit-residence.component.ts

import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {Residence, ResidenceType} from '../ access-data/residence.model';
import {ButtonComponent} from '../../../components/ui/buttons/button.component';
import {InputComponent} from '../../../components/ui/Input/input.component';
import {ModalComponent} from '../../../components/ui/modals/modal.component';
import {ResidenceService} from '../ access-data/residence.service';
import ToastService from '../../../components/ui/toast/toast.service';


@Component({
  selector: 'app-edit-residence-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    ButtonComponent,
    InputComponent,
    ModalComponent
  ],
  template: `
    <app-modal
      [title]="mode === 'view' ? 'Détails de la résidence' : 'Modifier une résidence'"
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <form [formGroup]="form" (ngSubmit)="submit()">

        <!-- Nom -->
        <app-input
          label="Nom de la résidence"
          placeholder="Les Jardins du Parc"
          icon="apartment"
          [required]="true"
          [control]="form.get('name')!"
          [errorMessage]="nameError"
        ></app-input>

        <!-- Adresse -->
        <app-input
          label="Adresse"
          placeholder="123 Avenue Mohammed V"
          icon="location_on"
          [control]="form.get('address')!"
        ></app-input>

        <!-- Ville et Code Postal -->
        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Ville"
            placeholder="Casablanca"
            icon="location_city"
            [control]="form.get('city')!"
          ></app-input>

          <app-input
            label="Code Postal"
            placeholder="20000"
            icon="markunread_mailbox"
            [control]="form.get('postalCode')!"
          ></app-input>
        </div>

        <!-- Type -->
        <app-input
          label="Type de résidence"
          type="select"
          icon="business"
          [required]="true"
          [control]="form.get('type')!"
          [options]="typeOptions"
        ></app-input>

        <!-- Nombre de bâtiments et d'unités -->
        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Nombre de bâtiments"
            type="number"
            placeholder="1"
            icon="domain"
            [required]="true"
            [control]="form.get('numberOfBuildings')!"
            [errorMessage]="buildingsError"
          ></app-input>

          <app-input
            label="Nombre d'unités"
            type="number"
            placeholder="0"
            icon="meeting_room"
            [required]="true"
            [control]="form.get('numberOfUnits')!"
            [errorMessage]="unitsError"
          ></app-input>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label">
            Description
          </label>
          <textarea
            formControlName="description"
            class="form-textarea"
            rows="4"
            placeholder="Décrivez la résidence..."
          ></textarea>
        </div>

      </form>

      <!-- Footer -->
      <div modal-footer class="flex justify-end gap-2">
        <app-button
          *ngIf="mode === 'edit'"
          variant="primary"
          size="medium"
          [loading]="loading()"
          type="submit"
          [disabled]="form.invalid || loading() || !hasChanges()"
          (btnClick)="submit()"
        >
          Modifier
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    .grid {
      display: grid;
    }

    .grid-cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    .gap-4 {
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: 'Poppins', sans-serif;
      resize: vertical;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #ffc312;
        box-shadow: 0 0 0 3px rgba(255, 195, 18, 0.1);
      }

      &::placeholder {
        color: #9ca3af;
      }
    }

    .flex {
      display: flex;
    }

    .justify-end {
      justify-content: flex-end;
    }

    .gap-2 {
      gap: 0.5rem;
    }
  `]
})
export class EditResidenceModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly residenceService = inject(ResidenceService);
  private readonly toast = inject(ToastService);
  protected readonly dialogRef = inject(MatDialogRef<EditResidenceModalComponent>);
  private readonly modalData = inject<{
    residence: Residence;
    mode: 'edit' | 'view';
  }>(MAT_DIALOG_DATA);

  @Output() residenceUpdated = new EventEmitter<Residence>();

  loading = signal(false);
  residence: Residence;
  mode: 'edit' | 'view' = 'edit';


  typeOptions = [
    { value: ResidenceType.APARTMENT_BUILDING, label: 'Immeuble' },
    { value: ResidenceType.TOWNHOUSE_COMPLEX, label: 'Complexe de maisons' },
    { value: ResidenceType.CONDOMINIUM, label: 'Copropriété' },
    { value: ResidenceType.GATED_COMMUNITY, label: 'Résidence fermée' },
    { value: ResidenceType.MIXED_USE, label: 'Usage mixte' }
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    address: [''],
    city: [''],
    postalCode: [''],
    type: [ResidenceType.APARTMENT_BUILDING, Validators.required],
    numberOfBuildings: [1, [Validators.required, Validators.min(1)]],
    numberOfUnits: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    isActive: [true]
  });

  constructor() {
    this.residence = this.modalData.residence;
    this.mode = this.modalData.mode || 'edit';
  }

  ngOnInit(): void {
    this.initForm();
    if (this.mode === 'view') {
      this.form.disable();
    }
  }

  private initForm(): void {
    this.form.patchValue({
      name: this.residence.name,
      address: this.residence.address,
      city: this.residence.city,
      postalCode: this.residence.postalCode,
      type: this.residence.type,
      numberOfBuildings: this.residence.numberOfBuildings,
      numberOfUnits: this.residence.numberOfUnits,
      description: this.residence.description,
      isActive: this.residence.isActive
    });
  }

  hasChanges(): boolean {
    const formValue = this.form.value;

    return (
      formValue.name !== this.residence.name ||
      formValue.address !== this.residence.address ||
      formValue.city !== this.residence.city ||
      formValue.postalCode !== this.residence.postalCode ||
      formValue.type !== this.residence.type ||
      formValue.numberOfBuildings !== this.residence.numberOfBuildings ||
      formValue.numberOfUnits !== this.residence.numberOfUnits ||
      formValue.description !== this.residence.description ||
      formValue.isActive !== this.residence.isActive
    );
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Veuillez corriger les erreurs du formulaire');
      return;
    }

    this.loading.set(true);

    const updateRequest: any = {
      name: this.form.value.name,
      address: this.form.value.address,
      city: this.form.value.city,
      postalCode: this.form.value.postalCode,
      type: this.form.value.type,
      numberOfBuildings: this.form.value.numberOfBuildings,
      numberOfUnits: this.form.value.numberOfUnits,
      description: this.form.value.description,
      isActive: this.form.value.isActive
    };

    this.residenceService.updateResidence(this.residence.uuid, updateRequest).subscribe({
      next: (response) => {
        this.toast.success('Résidence modifiée avec succès');
        this.residenceUpdated.emit(response);
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la modification');
        this.loading.set(false);
      }
    });
  }

  get nameError(): string {
    const control = this.form.get('name');
    if (control?.hasError('required') && control?.touched) {
      return 'Nom requis';
    }
    return '';
  }

  get buildingsError(): string {
    const control = this.form.get('numberOfBuildings');
    if (control?.hasError('required') && control?.touched) {
      return 'Nombre requis';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'Minimum 1';
    }
    return '';
  }

  get unitsError(): string {
    const control = this.form.get('numberOfUnits');
    if (control?.hasError('required') && control?.touched) {
      return 'Nombre requis';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'Minimum 0';
    }
    return '';
  }
}
