// src/app/features/admin/buildings/modals/create-building.component.ts

import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogRef } from '@angular/material/dialog';
import {ButtonComponent} from '../../../components/ui/buttons/button.component';
import {InputComponent} from '../../../components/ui/Input/input.component';
import {ModalComponent} from '../../../components/ui/modals/modal.component';
import {BuildingService} from '../access-data/building.service';
import {ResidenceService} from '../../residences/ access-data/residence.service';
import ToastService from '../../../components/ui/toast/toast.service';


@Component({
  selector: 'app-create-building-modal',
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
      title="Ajouter un bâtiment"
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <form [formGroup]="form" (ngSubmit)="submit()">

        <!-- Résidence -->
        <app-input
          label="Résidence"
          type="select"
          icon="apartment"
          [required]="true"
          [control]="form.get('residenceUuid')!"
          [options]="residenceOptions()"
          [errorMessage]="residenceError"
        ></app-input>

        <!-- Nom -->
        <app-input
          label="Nom du bâtiment"
          placeholder="Bâtiment A"
          icon="domain"
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

        <!-- Nombre d'étages et d'unités -->
        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Nombre d'étages"
            type="number"
            placeholder="1"
            icon="layers"
            [required]="true"
            [control]="form.get('numberOfFloors')!"
            [errorMessage]="floorsError"
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
            placeholder="Décrivez le bâtiment..."
          ></textarea>
        </div>

      </form>

      <!-- Footer -->
      <div modal-footer class="flex justify-end gap-2">
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
export class CreateBuildingModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly buildingService = inject(BuildingService);
  private readonly residenceService = inject(ResidenceService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<CreateBuildingModalComponent>);

  @Output() buildingCreated = new EventEmitter<any>();

  loading = signal(false);
  residenceOptions = signal<{ value: string; label: string }[]>([]);

  form = this.fb.group({
    residenceUuid: ['', Validators.required],
    name: ['', Validators.required],
    address: [''],
    numberOfFloors: [1, [Validators.required, Validators.min(1)]],
    numberOfUnits: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadResidences();
  }

  private loadResidences(): void {
    this.residenceService.getResidences({ active: true }).subscribe({
      next: (residences) => {
        const options = residences.map(r => ({
          value: r.uuid,
          label: r.name
        }));
        this.residenceOptions.set(options);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des résidences');
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.loading.set(true);

    this.buildingService.createBuilding(this.form.value as any).subscribe({
      next: (response) => {
        this.toast.success('Bâtiment créé avec succès');
        this.buildingCreated.emit(response);
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur création:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la création');
        this.loading.set(false);
      }
    });
  }

  get residenceError(): string {
    const control = this.form.get('residenceUuid');
    if (control?.hasError('required') && control?.touched) {
      return 'Résidence requise';
    }
    return '';
  }

  get nameError(): string {
    const control = this.form.get('name');
    if (control?.hasError('required') && control?.touched) {
      return 'Nom requis';
    }
    return '';
  }

  get floorsError(): string {
    const control = this.form.get('numberOfFloors');
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
