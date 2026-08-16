// src/app/features/syndic/residents/modals/edit-resident-syndic.component.ts

import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ResidentService } from '../../../admin/residents/access-data/resident.service';
import { UnitService } from '../../../admin/units/access-data/unit.service';
import { SyndicBuildingService } from '../../access-data/syndic-building.service';
import { ModalComponent } from '../../../components/ui/modals/modal.component';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import { InputComponent } from '../../../components/ui/Input/input.component';
import { ToggleComponent } from '../../../components/ui/toggle/toggle.component';
import { AuthService } from '../../../../core/auth/auth.service';
import ToastService from '../../../components/ui/toast/toast.service';
import { Resident } from '../../../admin/residents/access-data/resident.model';

@Component({
  selector: 'app-edit-resident-syndic-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    ModalComponent,
    ToggleComponent
  ],
  template: `
    <app-modal
      title="Modifier un résident"
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <form [formGroup]="form" (ngSubmit)="submit()">

        <!-- Informations personnelles -->
        <div class="section-title">Informations personnelles</div>

        <app-input
          label="Nom complet"
          placeholder="Ahmed Alami"
          icon="person"
          [required]="true"
          [control]="form.get('fullName')!"
          [errorMessage]="fullNameError"
        ></app-input>

        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Téléphone"
            placeholder="+212 6 12 34 56 78"
            icon="phone"
            [control]="form.get('phoneNumber')!"
          ></app-input>

          <app-input
            label="Email (optionnel)"
            type="email"
            placeholder="email@exemple.com"
            icon="email"
            [control]="form.get('email')!"
          ></app-input>
        </div>

        <!-- Contact d'urgence -->
        <div class="section-title">Contact d'urgence</div>

        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Nom du contact"
            placeholder="Fatima Alami"
            icon="contact_emergency"
            [control]="form.get('emergencyContact')!"
          ></app-input>

          <app-input
            label="Téléphone d'urgence"
            placeholder="+212 6 87 65 43 21"
            icon="phone"
            [control]="form.get('emergencyPhone')!"
          ></app-input>
        </div>

        <!-- Localisation SIMPLIFIÉE -->
        <div class="section-title">Localisation</div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Bâtiment -->
          <div class="form-group">
            <label class="form-label">
              Bâtiment <span class="required">*</span>
            </label>
            <select
              formControlName="buildingUuid"
              class="form-select"
              (change)="onBuildingChange($any($event.target).value)">
              <option value="">Sélectionnez un bâtiment</option>
              <option *ngFor="let opt of buildingOptions()" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <span *ngIf="buildingError" class="error-text">{{ buildingError }}</span>
          </div>

          <!-- Unité -->
          <div class="form-group">
            <label class="form-label">
              Unité <span class="required">*</span>
            </label>
            <select
              formControlName="unitUuid"
              class="form-select"
              [disabled]="loadingUnits() || unitOptions().length === 0">
              <option value="">Sélectionnez une unité</option>
              <option *ngFor="let opt of unitOptions()" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <div *ngIf="loadingUnits()" class="loading-text">Chargement des unités...</div>
            <span *ngIf="unitError" class="error-text">{{ unitError }}</span>
          </div>
        </div>

        <!-- Dates -->
        <div class="section-title">Dates</div>

        <div class="grid grid-cols-2 gap-4">
          <div class="date-field">
            <label class="date-label">Date d'entrée</label>
            <input
              type="date"
              formControlName="moveInDate"
              class="date-input"
            />
          </div>

          <div class="date-field">
            <label class="date-label">Date de sortie (optionnel)</label>
            <input
              type="date"
              formControlName="moveOutDate"
              class="date-input"
            />
          </div>
        </div>

        <!-- Options -->
        <div class="section-title">Options</div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="toggle-field">
            <label class="toggle-label">Propriétaire</label>
            <app-toggle formControlName="isOwner"></app-toggle>
          </div>

          <div class="toggle-field">
            <label class="toggle-label">Résident principal</label>
            <app-toggle formControlName="isPrimaryResident"></app-toggle>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea
            formControlName="notes"
            class="form-textarea"
            rows="3"
            placeholder="Notes additionnelles..."
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
          (btnClick)="submit()">
          Modifier
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    .section-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 1.5rem 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #ffc312;
    }

    .grid {
      display: grid;
    }

    .grid-cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    .gap-4 {
      gap: 1rem;
    }

    .mb-4 {
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;

      .required {
        color: #ef4444;
        margin-left: 2px;
      }
    }

    .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: 'Poppins', sans-serif;
      background: white;
      cursor: pointer;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #ffc312;
        box-shadow: 0 0 0 3px rgba(255, 195, 18, 0.1);
      }

      &:disabled {
        background: #f9fafb;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .error-text {
      display: block;
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .loading-text {
      color: #ffc312;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .date-field {
      margin-bottom: 1rem;

      .date-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .date-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-family: 'Poppins', sans-serif;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #ffc312;
          box-shadow: 0 0 0 3px rgba(255, 195, 18, 0.1);
        }
      }
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

    .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
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
export class EditResidentSyndicModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly residentService = inject(ResidentService);
  private readonly unitService = inject(UnitService);
  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly dialogRef = inject(MatDialogRef<EditResidentSyndicModalComponent>);
  private readonly modalData = inject<{ resident: Resident }>(MAT_DIALOG_DATA);

  @Output() residentUpdated = new EventEmitter<Resident>();

  loading = signal(false);
  loadingUnits = signal(false);
  resident: Resident;
  buildingOptions = signal<{ value: string; label: string }[]>([]);
  unitOptions = signal<{ value: string; label: string }[]>([]);

  form = this.fb.group({
    fullName: ['', Validators.required],
    phoneNumber: [''],
    email: [''],
    emergencyContact: [''],
    emergencyPhone: [''],
    buildingUuid: ['', Validators.required],
    unitUuid: ['', Validators.required],
    moveInDate: [''],
    moveOutDate: [''],
    isOwner: [false],
    isPrimaryResident: [true],
    notes: [''],
    isActive: [true]
  });

  constructor() {
    this.resident = this.modalData.resident;
  }

  ngOnInit(): void {
    this.loadMyBuildings();
    this.setupBuildingWatcher();
  }

  private loadMyBuildings(): void {
    const currentUserUuid = this.auth.getUsernameUUid();
    if (!currentUserUuid) return;

    this.syndicBuildingService.getBuildingsBySyndic(currentUserUuid).subscribe({
      next: (buildings) => {
        const options = buildings.map(b => ({
          value: b.buildingUuid,
          label: b.buildingName
        }));
        this.buildingOptions.set(options);

        // Charger les unités du bâtiment actuel du résident
        this.loadUnitsForBuilding(this.resident.buildingUuid);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement de vos bâtiments');
      }
    });
  }

  private loadUnitsForBuilding(buildingUuid: string): void {
    if (!buildingUuid) return;

    this.loadingUnits.set(true);

    this.unitService.getUnits({ buildingUuid, active: true }).subscribe({
      next: (units) => {
        const options = units.map(u => ({
          value: u.uuid,
          label: u.unitNumber
        }));
        this.unitOptions.set(options);
        this.loadingUnits.set(false);

        // Initialiser le formulaire après avoir chargé les unités
        setTimeout(() => this.initForm(), 100);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des unités');
        this.unitOptions.set([]);
        this.loadingUnits.set(false);
      }
    });
  }

  private setupBuildingWatcher(): void {
    this.form.get('buildingUuid')?.valueChanges.subscribe(buildingUuid => {
      if (buildingUuid && buildingUuid !== this.resident.buildingUuid) {
        this.onBuildingChange(buildingUuid);
      }
    });
  }

  onBuildingChange(buildingUuid: string | null): void {
    console.log('Bâtiment changé:', buildingUuid);

    if (!buildingUuid) {
      this.unitOptions.set([]);
      this.form.get('unitUuid')?.setValue('');
      return;
    }

    // Réinitialiser l'unité sélectionnée
    this.form.get('unitUuid')?.setValue('');
    this.loadingUnits.set(true);

    // Charger les unités du nouveau bâtiment
    this.unitService.getUnits({ buildingUuid, active: true }).subscribe({
      next: (units) => {
        console.log('Unités chargées:', units);
        const options = units.map(u => ({
          value: u.uuid,
          label: u.unitNumber
        }));
        this.unitOptions.set(options);
        this.loadingUnits.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement unités:', err);
        this.toast.error('Erreur lors du chargement des unités');
        this.unitOptions.set([]);
        this.loadingUnits.set(false);
      }
    });
  }

  private initForm(): void {
    const moveInDate = this.resident.moveInDate
      ? new Date(this.resident.moveInDate).toISOString().split('T')[0]
      : '';
    const moveOutDate = this.resident.moveOutDate
      ? new Date(this.resident.moveOutDate).toISOString().split('T')[0]
      : '';

    this.form.patchValue({
      fullName: this.resident.fullName,
      phoneNumber: this.resident.phoneNumber || '',
      email: '', // Email pas dans le model original
      emergencyContact: this.resident.emergencyContact || '',
      emergencyPhone: this.resident.emergencyPhone || '',
      buildingUuid: this.resident.buildingUuid,
      unitUuid: this.resident.unitUuid,
      moveInDate: moveInDate,
      moveOutDate: moveOutDate,
      isOwner: this.resident.isOwner,
      isPrimaryResident: this.resident.isPrimaryResident,
      notes: this.resident.notes || '',
      isActive: this.resident.isActive
    });

    console.log('Form initialized with:', this.form.value);
  }

  hasChanges(): boolean {
    const formValue = this.form.value;

    const moveInChanged = formValue.moveInDate !== (
      this.resident.moveInDate
        ? new Date(this.resident.moveInDate).toISOString().split('T')[0]
        : ''
    );

    const moveOutChanged = formValue.moveOutDate !== (
      this.resident.moveOutDate
        ? new Date(this.resident.moveOutDate).toISOString().split('T')[0]
        : ''
    );

    return (
      formValue.fullName !== this.resident.fullName ||
      formValue.phoneNumber !== (this.resident.phoneNumber || '') ||
      formValue.emergencyContact !== (this.resident.emergencyContact || '') ||
      formValue.emergencyPhone !== (this.resident.emergencyPhone || '') ||
      formValue.buildingUuid !== this.resident.buildingUuid ||
      formValue.unitUuid !== this.resident.unitUuid ||
      moveInChanged ||
      moveOutChanged ||
      formValue.isOwner !== this.resident.isOwner ||
      formValue.isPrimaryResident !== this.resident.isPrimaryResident ||
      formValue.notes !== (this.resident.notes || '') ||
      formValue.isActive !== this.resident.isActive
    );
  }

  submit(): void {
    console.log('Form values:', this.form.value);
    console.log('Form valid:', this.form.valid);
    console.log('Has changes:', this.hasChanges());

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.error('Form errors:', this.form.errors);
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.errors) {
          console.error(`${key} errors:`, control.errors);
        }
      });
      this.toast.warning('Veuillez corriger les erreurs du formulaire');
      return;
    }

    if (!this.hasChanges()) {
      this.toast.info('Aucune modification détectée');
      return;
    }

    this.loading.set(true);

    const formValue = this.form.value;
    const request: any = {
      fullName: formValue.fullName,
      phoneNumber: formValue.phoneNumber || null,
      emergencyContact: formValue.emergencyContact || null,
      emergencyPhone: formValue.emergencyPhone || null,
      unitUuid: formValue.unitUuid,
      moveInDate: formValue.moveInDate || null,
      moveOutDate: formValue.moveOutDate || null,
      isOwner: formValue.isOwner,
      isPrimaryResident: formValue.isPrimaryResident,
      notes: formValue.notes || null,
      isActive: formValue.isActive
    };

    console.log('Request payload:', request);

    this.residentService.updateResident(this.resident.uuid, request).subscribe({
      next: (response) => {
        console.log('Résident modifié:', response);
        this.toast.success('Résident modifié avec succès');
        this.residentUpdated.emit(response);
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la modification');
        this.loading.set(false);
      }
    });
  }

  get fullNameError(): string {
    const control = this.form.get('fullName');
    if (control?.hasError('required') && control?.touched) {
      return 'Nom requis';
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

  get unitError(): string {
    const control = this.form.get('unitUuid');
    if (control?.hasError('required') && control?.touched) {
      return 'Unité requise';
    }
    return '';
  }
}
