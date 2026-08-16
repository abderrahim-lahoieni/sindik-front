// src/app/features/admin/residents/modals/create-resident.component.ts

import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ResidentService } from '../access-data/resident.service';
import { UnitService } from '../../units/access-data/unit.service';
import { BuildingService } from '../../buildings/access-data/building.service';
import { UserService } from '../../users/access-data/user.service';
import {ToggleComponent} from '../../../components/ui/toggle/toggle.component';
import {ModalComponent} from '../../../components/ui/modals/modal.component';
import ToastService from '../../../components/ui/toast/toast.service';
import {ResidenceService} from '../../residences/ access-data/residence.service';
import {ButtonComponent} from '../../../components/ui/buttons/button.component';
import {InputComponent} from '../../../components/ui/Input/input.component';


@Component({
  selector: 'app-create-resident-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
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
            label="Lier à un compte utilisateur"
            type="select"
            icon="account_circle"
            [control]="form.get('userUuid')!"
            [options]="userOptions()"
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

        <div class="grid grid-cols-3 gap-4">
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
            [control]="buildingControl"
            [options]="buildingOptions()"
          ></app-input>

          <app-input
            label="Unité"
            type="select"
            icon="meeting_room"
            [required]="true"
            [control]="UnitControl"
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
          [disabled]="form.invalid || residenceControl.invalid || buildingControl.invalid || loading()"
          (btnClick)="submit()"
        >
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

    .grid-cols-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    .gap-4 {
      gap: 1rem;
    }

    .mb-4 {
      margin-bottom: 1rem;
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
export class CreateResidentModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly residentService = inject(ResidentService);
  private readonly unitService = inject(UnitService);
  private readonly buildingService = inject(BuildingService);
  private readonly residenceService = inject(ResidenceService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<CreateResidentModalComponent>);

  @Output() residentCreated = new EventEmitter<any>();

  loading = signal(false);
  residenceOptions = signal<{ value: string; label: string }[]>([]);
  buildingOptions = signal<{ value: string; label: string }[]>([]);
  unitOptions = signal<{ value: string; label: string }[]>([]);
  userOptions = signal<{ value: string; label: string }[]>([]);

  residenceControl = this.fb.control('', Validators.required);
  buildingControl = this.fb.control('', Validators.required);
  UnitControl = this.fb.control('');


  form = this.fb.group({
    fullName: ['', Validators.required],
    phoneNumber: [''],
    emergencyContact: [''],
    emergencyPhone: [''],

    userUuid: [''],
    moveInDate: [null as Date | null],
    moveOutDate: [null as Date | null],
    isOwner: [false],
    isPrimaryResident: [true],
    notes: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadResidences();
    this.loadUsers();
    this.setupCascadeSelects();
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

  private loadUsers(): void {
    this.userService.getUsers({ active: true }).subscribe({
      next: (users) => {
        const options = [
          { value: '', label: 'Aucun compte' },
          ...users.map(u => ({
            value: u.uuid,
            label: `${u.fullName} (${u.email})`
          }))
        ];
        this.userOptions.set(options);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des utilisateurs');
      }
    });
  }

  private setupCascadeSelects(): void {

    this.residenceControl.valueChanges.subscribe(residenceUuid => {

      this.buildingOptions.set([]);
      this.unitOptions.set([]);

      this.buildingControl.setValue('');
      this.UnitControl.setValue('');

      if (!residenceUuid) return;

      this.buildingService.getBuildings({ residenceUuid, active: true })
        .subscribe({
          next: buildings => {
            this.buildingOptions.set(
              buildings.map(b => ({
                value: b.uuid,
                label: b.name
              }))
            );
          }
        });
    });


    this.buildingControl.valueChanges.subscribe(buildingUuid => {

      this.unitOptions.set([]);
      this.UnitControl.setValue('');

      if (!buildingUuid) return;

      this.unitService.getUnits({ buildingUuid, active: true })
        .subscribe({
          next: units => {
            this.unitOptions.set(
              units.map(u => ({
                value: u.uuid,
                label: u.unitNumber
              }))
            );
          }
        });
    });
  }
  submit() {
    if (
      this.form.invalid ||
      this.residenceControl.invalid ||
      this.buildingControl.invalid
    ) {
      this.form.markAllAsTouched();
      this.residenceControl.markAsTouched();
      this.buildingControl.markAsTouched();
      this.UnitControl.markAsTouched();
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
      unitUuid: this.UnitControl.value || null,
      userUuid: formValue.userUuid || null,
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
        console.error('Erreur création:', err);
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

  get unitError(): string {
    const control = this.UnitControl;
    if (control?.hasError('required') && control?.touched) {
      return 'Unité requise';
    }
    return '';
  }
}
