// src/app/features/admin/units/modals/edit-unit.component.ts

import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {InputComponent} from '../../../components/ui/Input/input.component';
import {ButtonComponent} from '../../../components/ui/buttons/button.component';
import {ModalComponent} from '../../../components/ui/modals/modal.component';
import {ToggleComponent} from '../../../components/ui/toggle/toggle.component';
import {UnitService} from '../access-data/unit.service';
import {BuildingService} from '../../buildings/access-data/building.service';
import {ResidenceService} from '../../residences/ access-data/residence.service';
import ToastService from '../../../components/ui/toast/toast.service';
import {Unit, UnitType} from '../access-data/unit.model';


@Component({
  selector: 'app-edit-unit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    ButtonComponent,
    InputComponent,
    ModalComponent,
    ToggleComponent
  ],
  template: `
    <app-modal
      title="Modifier une unité"
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <form [formGroup]="form" (ngSubmit)="submit()">

        <!-- Résidence et Bâtiment -->
        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Résidence"
            type="select"
            icon="apartment"
            [required]="true"
            [control]="residenceControl"
            [options]="residenceOptions()"
          ></app-input>

          <app-input
            label="Bâtiment"
            type="select"
            icon="domain"
            [required]="true"
            [control]="form.get('buildingUuid')!"
            [options]="buildingOptions()"
            [errorMessage]="buildingError"
          ></app-input>
        </div>

        <!-- N° Unité et Type -->
        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="N° Unité"
            placeholder="A101"
            icon="meeting_room"
            [required]="true"
            [control]="form.get('unitNumber')!"
            [errorMessage]="unitNumberError"
          ></app-input>

          <app-input
            label="Type"
            type="select"
            icon="category"
            [required]="true"
            [control]="form.get('type')!"
            [options]="typeOptions"
            [errorMessage]="typeError"
          ></app-input>
        </div>

        <!-- Étage et Surface -->
        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Étage"
            type="number"
            placeholder="0"
            icon="layers"
            [required]="true"
            [control]="form.get('floorNumber')!"
            [errorMessage]="floorError"
          ></app-input>

          <app-input
            label="Surface (m²)"
            type="number"
            placeholder="85.5"
            icon="square_foot"
            [control]="form.get('area')!"
          ></app-input>
        </div>

        <!-- Pièces et Salles de bain -->
        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Nombre de pièces"
            type="number"
            placeholder="3"
            icon="room_preferences"
            [control]="form.get('numberOfRooms')!"
          ></app-input>

          <app-input
            label="Salles de bain"
            type="number"
            placeholder="2"
            icon="bathroom"
            [control]="form.get('numberOfBathrooms')!"
          ></app-input>
        </div>

        <!-- Options (Balcon, Parking, Occupation) -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="toggle-field">
            <label class="toggle-label">Balcon</label>
            <app-toggle formControlName="hasBalcony"></app-toggle>
          </div>

          <div class="toggle-field">
            <label class="toggle-label">Parking</label>
            <app-toggle formControlName="hasParking"></app-toggle>
          </div>

          <div class="toggle-field">
            <label class="toggle-label">Occupé</label>
            <app-toggle formControlName="isOccupied"></app-toggle>
          </div>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label">
            Description
          </label>
          <textarea
            formControlName="description"
            class="form-textarea"
            rows="3"
            placeholder="Décrivez l'unité..."
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

    .grid-cols-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    .gap-4 {
      gap: 1rem;
    }

    .mb-4 {
      margin-bottom: 1rem;
    }

    .toggle-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: #f9fafb;

      .toggle-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin: 0;
      }
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
export class EditUnitModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly unitService = inject(UnitService);
  private readonly buildingService = inject(BuildingService);
  private readonly residenceService = inject(ResidenceService);
  private readonly toast = inject(ToastService);
  protected readonly dialogRef = inject(MatDialogRef<EditUnitModalComponent>);
  private readonly modalData = inject<{ unit: Unit }>(MAT_DIALOG_DATA);

  @Output() unitUpdated = new EventEmitter<Unit>();

  loading = signal(false);
  unit: Unit;
  residenceOptions = signal<{ value: string; label: string }[]>([]);
  buildingOptions = signal<{ value: string; label: string }[]>([]);

  residenceControl = this.fb.control('', Validators.required);

  typeOptions = [
    { value: UnitType.APARTMENT, label: 'Appartement' },
    { value: UnitType.STUDIO, label: 'Studio' },
    { value: UnitType.DUPLEX, label: 'Duplex' },
    { value: UnitType.PENTHOUSE, label: 'Penthouse' },
    { value: UnitType.COMMERCIAL, label: 'Commercial' },
    { value: UnitType.PARKING, label: 'Parking' },
    { value: UnitType.STORAGE, label: 'Stockage' }
  ];

  form = this.fb.group({
    unitNumber: ['', Validators.required],
    buildingUuid: ['', Validators.required],
    type: [UnitType.APARTMENT, Validators.required],
    floorNumber: [0, [Validators.required, Validators.min(0)]],
    area: [null as number | null],
    numberOfRooms: [null as number | null, Validators.min(0)],
    numberOfBathrooms: [null as number | null, Validators.min(0)],
    hasBalcony: [false],
    hasParking: [false],
    description: [''],
    isOccupied: [false],
    isActive: [true]
  });

  constructor() {
    this.unit = this.modalData.unit;
  }

  ngOnInit(): void {
    this.loadResidences();
    this.setupResidenceWatcher();
  }

  private loadResidences(): void {
    this.residenceService.getResidences({ active: true }).subscribe({
      next: (residences) => {
        const options = residences.map(r => ({
          value: r.uuid,
          label: r.name
        }));
        this.residenceOptions.set(options);

        // Définir la résidence actuelle
        this.residenceControl.setValue(this.unit.residenceUuid);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des résidences');
      }
    });
  }

  private setupResidenceWatcher(): void {
    this.residenceControl.valueChanges.subscribe(residenceUuid => {
      if (residenceUuid) {
        this.buildingService.getBuildings({ residenceUuid, active: true }).subscribe({
          next: (buildings) => {
            const options = buildings.map(b => ({
              value: b.uuid,
              label: b.name
            }));
            this.buildingOptions.set(options);

            // Si c'est l'initialisation, définir le bâtiment actuel
            if (!this.form.get('buildingUuid')?.value) {
              setTimeout(() => this.initForm());
            }
          },
          error: () => {
            this.toast.error('Erreur lors du chargement des bâtiments');
          }
        });
      } else {
        this.buildingOptions.set([]);
      }
    });
  }

  private initForm(): void {
    this.form.patchValue({
      unitNumber: this.unit.unitNumber,
      buildingUuid: this.unit.buildingUuid,
      type: this.unit.type,
      floorNumber: this.unit.floorNumber,
      area: this.unit.area,
      numberOfRooms: this.unit.numberOfRooms,
      numberOfBathrooms: this.unit.numberOfBathrooms,
      hasBalcony: this.unit.hasBalcony,
      hasParking: this.unit.hasParking,
      description: this.unit.description,
      isOccupied: this.unit.isOccupied,
      isActive: this.unit.isActive
    });
  }

  hasChanges(): boolean {
    const formValue = this.form.value;

    return (
      formValue.unitNumber !== this.unit.unitNumber ||
      formValue.buildingUuid !== this.unit.buildingUuid ||
      formValue.type !== this.unit.type ||
      formValue.floorNumber !== this.unit.floorNumber ||
      formValue.area !== this.unit.area ||
      formValue.numberOfRooms !== this.unit.numberOfRooms ||
      formValue.numberOfBathrooms !== this.unit.numberOfBathrooms ||
      formValue.hasBalcony !== this.unit.hasBalcony ||
      formValue.hasParking !== this.unit.hasParking ||
      formValue.description !== this.unit.description ||
      formValue.isOccupied !== this.unit.isOccupied ||
      formValue.isActive !== this.unit.isActive
    );
  }

  submit() {
    if (this.form.invalid || this.residenceControl.invalid) {
      this.form.markAllAsTouched();
      this.residenceControl.markAsTouched();
      this.toast.warning('Veuillez corriger les erreurs du formulaire');
      return;
    }

    this.loading.set(true);

    const updateRequest: any = {
      unitNumber: this.form.value.unitNumber,
      buildingUuid: this.form.value.buildingUuid,
      type: this.form.value.type,
      floorNumber: this.form.value.floorNumber,
      area: this.form.value.area,
      numberOfRooms: this.form.value.numberOfRooms,
      numberOfBathrooms: this.form.value.numberOfBathrooms,
      hasBalcony: this.form.value.hasBalcony,
      hasParking: this.form.value.hasParking,
      description: this.form.value.description,
      isOccupied: this.form.value.isOccupied,
      isActive: this.form.value.isActive
    };

    this.unitService.updateUnit(this.unit.uuid, updateRequest).subscribe({
      next: (response) => {
        this.toast.success('Unité modifiée avec succès');
        this.unitUpdated.emit(response);
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la modification');
        this.loading.set(false);
      }
    });
  }

  get unitNumberError(): string {
    const control = this.form.get('unitNumber');
    if (control?.hasError('required') && control?.touched) {
      return 'N° unité requis';
    }
    return '';
  }

  get buildingError(): string {
    const control = this.form.get('buildingUuid');
    if (control?.hasError('required') && control?.touched) {
      return 'Bâtiment requis';
    }
    return '';
  }

  get typeError(): string {
    const control = this.form.get('type');
    if (control?.hasError('required') && control?.touched) {
      return 'Type requis';
    }
    return '';
  }

  get floorError(): string {
    const control = this.form.get('floorNumber');
    if (control?.hasError('required') && control?.touched) {
      return 'Étage requis';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'Minimum 0';
    }
    return '';
  }
}
