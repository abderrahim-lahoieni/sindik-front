// src/app/features/syndic/residents/modals/create-resident-syndic.component.ts

import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';

import { ResidentService } from '../../../admin/residents/access-data/resident.service';
import { UnitService } from '../../../admin/units/access-data/unit.service';
import { SyndicBuildingService } from '../../access-data/syndic-building.service';
import {ModalComponent} from '../../../components/ui/modals/modal.component';
import {ButtonComponent} from '../../../components/ui/buttons/button.component';
import {InputComponent} from '../../../components/ui/Input/input.component';
import {ToggleComponent} from '../../../components/ui/toggle/toggle.component';
import {AuthService} from '../../../../core/auth/auth.service';
import ToastService from '../../../components/ui/toast/toast.service';

@Component({
  selector: 'app-create-resident-syndic-modal',
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
      title="Ajouter un résident"
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

        <!-- Localisation -->
        <div class="section-title">Localisation</div>

        <div class="grid grid-cols-2 gap-4">
          <!-- AJOUTER (selectChange) -->
          <app-input
            label="Bâtiment"
            type="select"
            icon="domain"
            [required]="true"
            [control]="form.get('buildingUuid')!"
            [options]="buildingOptions()"
            [errorMessage]="buildingError"
            (selectChange)="onBuildingChange($event)"
          ></app-input>

          <!-- Afficher loading pendant le chargement des unités -->
          <app-input
            label="Unité"
            type="select"
            icon="meeting_room"
            [required]="true"
            [control]="form.get('unitUuid')!"
            [options]="unitOptions()"
            [errorMessage]="unitError"
          ></app-input>
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
          [disabled]="form.invalid || loading()"
          (btnClick)="submit()">
          Ajouter
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

    .input-wrapper {
      position: relative;

      .loading-indicator {
        position: absolute;
        bottom: -20px;
        left: 0;
        font-size: 0.75rem;
        color: #ffc312;
        font-weight: 500;
        animation: pulse 1.5s infinite;
      }
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
        border: 1px solid #e5e7eb;
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
export class CreateResidentSyndicModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly residentService = inject(ResidentService);
  private readonly unitService = inject(UnitService);
  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<CreateResidentSyndicModalComponent>);

  @Output() residentCreated = new EventEmitter<any>();

  loading = signal(false);
  loadingUnits = signal(false); // AJOUTER
  buildingOptions = signal<{ value: string; label: string }[]>([]);
  unitOptions = signal<{ value: string; label: string }[]>([
    { value: '', label: 'Sélectionner un bâtiment d\'abord' }
  ]);

  form = this.fb.group({
    fullName: ['', Validators.required],
    phoneNumber: [''],
    email: [''],
    emergencyContact: [''],
    emergencyPhone: [''],
    buildingUuid: ['', Validators.required],
    unitUuid: ['', Validators.required],
    moveInDate: [null as Date | null],
    moveOutDate: [null as Date | null],
    isOwner: [false],
    isPrimaryResident: [true],
    notes: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadMyBuildings();
  }

  private loadMyBuildings(): void {
    const currentUserUuid = this.auth.getUsernameUUid();
    if (!currentUserUuid) return;

    this.syndicBuildingService.getBuildingsBySyndic(currentUserUuid).subscribe({
      next: (buildings) => {
        const options = [
          ...buildings.map(b => ({
          value: b.buildingUuid,
          label: b.buildingName
        }))]
        this.buildingOptions.set(options);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement de vos bâtiments');
      }
    });
  }

  // NOUVELLE MÉTHODE - Appelée quand le bâtiment change
  onBuildingChange(buildingUuid: string): void {
    if (!buildingUuid) {
      this.unitOptions.set([]);
      this.form.get('unitUuid')?.setValue('');
      return;
    }

    // Réinitialiser l'unité sélectionnée
    this.form.get('unitUuid')?.setValue('');
    this.loadingUnits.set(true);

    // Charger les unités du bâtiment
    this.unitService.getUnits({ buildingUuid, active: true }).subscribe({
      next: (units) => {
        console.log('Unités chargées:', units);
        const options = units.map(u => ({
          value: u.uuid,
          label: u.unitNumber
        }))
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

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.error('Form errors:', this.form.errors);
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.errors) {
          console.error(`${key} errors:`, control.errors);
        }
      });
      this.toast.warning('Veuillez remplir tous les champs obligatoires');
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
      moveInDate: formValue.moveInDate,
      moveOutDate: formValue.moveOutDate,
      isOwner: formValue.isOwner,
      isPrimaryResident: formValue.isPrimaryResident,
      notes: formValue.notes,
      isActive: formValue.isActive
    };
    this.residentService.createResident(request).subscribe({
      next: (response) => {
        this.toast.success('Résident créé avec succès');
        this.residentCreated.emit(response);
        this.dialogRef.close(response);
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Erreur lors de la création');
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
