// src/app/features/syndic/units/modals/create-unit-syndic.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import { InputComponent } from '../../../components/ui/Input/input.component';
import { ModalComponent } from '../../../components/ui/modals/modal.component';
import { ToggleComponent } from '../../../components/ui/toggle/toggle.component';
import { UnitService } from '../../../admin/units/access-data/unit.service';
import { SyndicBuildingService } from '../../access-data/syndic-building.service';
import { AuthService } from '../../../../core/auth/auth.service';
import ToastService from '../../../components/ui/toast/toast.service';
import { UnitType } from '../../../admin/units/access-data/unit.model';

@Component({
  selector: 'app-create-unit-syndic-modal',
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
      title="Créer une nouvelle unité"
      [showCloseButton]="true"
      [hasFooter]="true"
      (closeModal)="cancel()"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="unit-form">

        <!-- Bâtiment (seulement les bâtiments gérés) -->
        <div class="form-group full-width">
             <app-input
            label="Bâtiment"
           type="select"
            placeholder="Ex: A101"
            icon="meeting_room"
            [required]="true"
            [options]="buildingOptions()"
            [control]="form.get('buildingUuid')!"
            [errorMessage]="buildingError"
            [disabled]="loadingBuildings()"
          ></app-input>
        </div>

        <!-- N° Unité et Type - Utilisation de app-input -->
        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="N° Unité"
            placeholder="Ex: A101"
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

        <!-- Étage et Surface - Utilisation de app-input -->
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
            placeholder="Ex: 85.5"
            icon="square_foot"
            [control]="form.get('area')!"
          ></app-input>
        </div>

        <!-- Pièces et Salles de bain - Utilisation de app-input -->
        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Nombre de pièces"
            type="number"
            placeholder="Ex: 3"
            icon="room_preferences"
            [control]="form.get('numberOfRooms')!"
          ></app-input>

          <app-input
            label="Salles de bain"
            type="number"
            placeholder="Ex: 2"
            icon="bathroom"
            [control]="form.get('numberOfBathrooms')!"
          ></app-input>
        </div>

        <!-- Options (Balcon, Parking) -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="toggle-field">
            <div class="toggle-label">
              <span class="material-icons">balcony</span>
              <span>Balcon</span>
            </div>
            <app-toggle formControlName="hasBalcony"></app-toggle>
          </div>

          <div class="toggle-field">
            <div class="toggle-label">
              <span class="material-icons">local_parking</span>
              <span>Parking</span>
            </div>
            <app-toggle formControlName="hasParking"></app-toggle>
          </div>
        </div>

        <!-- Description -->
        <div class="form-group full-width">
          <label class="form-label">
            <span class="material-icons">description</span>
            Description
          </label>
          <textarea
            formControlName="description"
            class="form-textarea"
            rows="4"
            placeholder="Décrivez l'unité (optionnel)..."
          ></textarea>
        </div>

      </form>

      <!-- Footer -->
      <div modal-footer class="modal-footer">
        <app-button
          size="medium"
          (btnClick)="cancel()">
          <span class="material-icons">close</span>
          Annuler
        </app-button>
        <app-button
          variant="primary"
          size="medium"
          [loading]="loading()"
          type="submit"
          [disabled]="form.invalid || loading()"
          (btnClick)="submit()">
          <span class="material-icons" *ngIf="!loading()">add</span>
          Créer l'unité
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    :host {
      display: block;
      --primary-color: #ffc312;
      --primary-hover: #ffb400;
      --error-color: #ef4444;
      --success-color: #10b981;
      --text-primary: #0f172a;
      --text-secondary: #374151;
      --text-muted: #6b7280;
      --border-color: #e5e7eb;
      --bg-light: #f9fafb;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
      --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .unit-form {
      padding: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
      background: white;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: var(--bg-light);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;

        &:hover {
          background: #9ca3af;
        }
      }
    }

    /* En-tête du formulaire */
    .form-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
      border: 1px solid #fde68a;
      border-radius: var(--radius-lg);

      .header-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 50%;
        box-shadow: var(--shadow-sm);

        .material-icons {
          font-size: 24px;
          color: var(--primary-color);
        }
      }

      .header-text {
        h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        p {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
      }
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

    .full-width {
      grid-column: span 2;
    }

    /* Groupes de formulaire */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.25rem;

      &.full-width {
        grid-column: span 2;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;

      .material-icons {
        font-size: 20px;
        color: var(--primary-color);
      }

      .required {
        color: var(--error-color);
        margin-left: 2px;
        font-weight: 700;
      }
    }

    /* Inputs et selects */
    .form-input,
    .form-select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      color: var(--text-primary);
      background: white;
      transition: var(--transition);
      appearance: none;
      -webkit-appearance: none;

      &:hover:not(:disabled) {
        border-color: #d1d5db;
      }

      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(255, 195, 18, 0.15);
        transform: translateY(-1px);
      }

      &.has-error {
        border-color: var(--error-color);
        
        &:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }
      }

      &:disabled {
        background: var(--bg-light);
        cursor: not-allowed;
        opacity: 0.6;
      }

      &::placeholder {
        color: #9ca3af;
        font-weight: 400;
      }
    }

    .select-wrapper {
      position: relative;

      .select-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        font-size: 20px;
        color: var(--text-muted);
        transition: var(--transition);
      }

      &:focus-within .select-icon {
        color: var(--primary-color);
        transform: translateY(-50%) rotate(180deg);
      }
    }

    .form-textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      color: var(--text-primary);
      background: white;
      resize: vertical;
      min-height: 100px;
      transition: var(--transition);

      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(255, 195, 18, 0.15);
      }

      &::placeholder {
        color: #9ca3af;
        font-weight: 400;
      }
    }

    /* Box d'information du bâtiment */
    .building-info-box {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 2px solid #bfdbfe;
      border-radius: var(--radius-lg);
      padding: 1rem;
      margin-bottom: 1.25rem;
      animation: slideIn 0.3s ease-out;

      .info-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #dbeafe;

        .material-icons {
          font-size: 20px;
          color: #3b82f6;
        }
      }

      .info-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0;

        .info-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .info-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }
      }
    }

    /* Toggle fields */
    .toggle-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-light);
      transition: var(--transition);
      cursor: pointer;

      &:hover {
        border-color: rgba(255, 195, 18, 0.4);
        background: white;
        box-shadow: var(--shadow-sm);
        transform: translateY(-1px);
      }

      .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin: 0;
        user-select: none;

        .material-icons {
          font-size: 20px;
          color: var(--primary-color);
        }
      }
    }

    /* Messages d'erreur */
    .error-text {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--error-color);
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;
      animation: shake 0.3s ease-in-out;

      .material-icons {
        font-size: 14px;
      }
    }

    .loading-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--primary-color);
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;

      .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid #fde68a;
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    /* Footer */
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: var(--bg-light);
      border-top: 1px solid var(--border-color);

      app-button {
        display: inline-flex;
        align-items: center;

        .material-icons {
          font-size: 18px;
          margin-right: 0.5rem;
        }
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

    /* Animations */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .unit-form {
        padding: 1rem;
        max-height: 80vh;
      }

      .grid-cols-2 {
        grid-template-columns: 1fr;
      }

      .full-width {
        grid-column: span 1;
      }

      .form-header {
        flex-direction: column;
        text-align: center;

        .header-icon {
          width: 40px;
          height: 40px;

          .material-icons {
            font-size: 20px;
          }
        }
      }

      .modal-footer {
        padding: 0.75rem 1rem;
        
        app-button {
          flex: 1;
        }
      }

      .toggle-field {
        padding: 0.75rem;
      }
    }

    @media (max-width: 480px) {
      .unit-form {
        padding: 0.75rem;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .building-info-box {
        padding: 0.75rem;
      }

      .form-input,
      .form-select,
      .form-textarea {
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
      }
    }
  `]
})
export class CreateUnitSyndicModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly unitService = inject(UnitService);
  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<CreateUnitSyndicModalComponent>);

  loading = signal(false);
  loadingBuildings = signal(false);
  
  buildingOptions = signal<{ value: string; label: string }[]>([]);
  selectedBuilding = signal<any>(null);

  form = this.fb.group({
    buildingUuid: ['', Validators.required],
    unitNumber: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
    type: [UnitType.APARTMENT, Validators.required],
    floorNumber: [0, [Validators.required, Validators.min(0), Validators.max(200)]],
    area: [null as number | null, [Validators.min(0), Validators.max(10000)]],
    numberOfRooms: [null as number | null, [Validators.min(0), Validators.max(50)]],
    numberOfBathrooms: [null as number | null, [Validators.min(0), Validators.max(50)]],
    hasBalcony: [false],
    hasParking: [false],
    description: ['', Validators.maxLength(500)],
    isOccupied: [false],
    isActive: [true]
  });

  typeOptions = [
    { value: UnitType.APARTMENT, label: 'Appartement' },
    { value: UnitType.STUDIO, label: 'Studio' },
    { value: UnitType.DUPLEX, label: 'Duplex' },
    { value: UnitType.PENTHOUSE, label: 'Penthouse' },
    { value: UnitType.COMMERCIAL, label: 'Commercial' },
    { value: UnitType.PARKING, label: 'Parking' },
    { value: UnitType.STORAGE, label: 'Stockage' }
  ];

  ngOnInit(): void {
    this.loadMyBuildings();
  }

  private loadMyBuildings(): void {
    const currentUserUuid = this.auth.getUsernameUUid();
    if (!currentUserUuid) {
      this.toast.error('Utilisateur non authentifié');
      return;
    }

    this.loadingBuildings.set(true);

    this.syndicBuildingService.getBuildingsBySyndic(currentUserUuid).subscribe({
      next: (buildings) => {
        const options = buildings.map(b => ({
          value: b.buildingUuid,
          label: `${b.buildingName}${b.residenceName ? ` - ${b.residenceName}` : ''}`
        }));
        this.buildingOptions.set(options);
        this.loadingBuildings.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement bâtiments:', err);
        this.toast.error('Erreur lors du chargement de vos bâtiments');
        this.loadingBuildings.set(false);
      }
    });
  }

  onBuildingChange(buildingUuid: string): void {
    if (!buildingUuid) {
      this.selectedBuilding.set(null);
      return;
    }

    const currentUserUuid = this.auth.getUsernameUUid();
    if (!currentUserUuid) return;

    this.syndicBuildingService.getBuildingsBySyndic(currentUserUuid).subscribe({
      next: (buildings) => {
        const building = buildings.find(b => b.buildingUuid === buildingUuid);
        this.selectedBuilding.set(building || null);
      },
      error: (err) => {
        console.error('Erreur récupération bâtiment:', err);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.loading.set(true);

    const formValue = this.form.value;
    const request = {
      buildingUuid: formValue.buildingUuid,
      unitNumber: formValue.unitNumber?.trim(),
      type: formValue.type,
      floorNumber: formValue.floorNumber,
      area: formValue.area || null,
      numberOfRooms: formValue.numberOfRooms || null,
      numberOfBathrooms: formValue.numberOfBathrooms || null,
      hasBalcony: formValue.hasBalcony || false,
      hasParking: formValue.hasParking || false,
      description: formValue.description?.trim() || null,
      isOccupied: formValue.isOccupied || false,
      isActive: formValue.isActive ?? true
    };

    this.unitService.createUnit(request as any).subscribe({
      next: (response) => {
        this.toast.success('Unité créée avec succès');
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur création:', err);
        const errorMessage = err.error?.error || err.error?.message || 'Erreur lors de la création';
        this.toast.error(errorMessage);
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  get buildingError(): string {
    const control = this.form.get('buildingUuid');
    if (control?.hasError('required') && control?.touched) {
      return 'Le bâtiment est requis';
    }
    return '';
  }

  get unitNumberError(): string {
    const control = this.form.get('unitNumber');
    if (control?.hasError('required') && control?.touched) {
      return 'Le numéro d\'unité est requis';
    }
    if (control?.hasError('maxlength') && control?.touched) {
      return 'Maximum 50 caractères';
    }
    return '';
  }

  get typeError(): string {
    const control = this.form.get('type');
    if (control?.hasError('required') && control?.touched) {
      return 'Le type est requis';
    }
    return '';
  }

  get floorError(): string {
    const control = this.form.get('floorNumber');
    if (control?.hasError('required') && control?.touched) {
      return 'L\'étage est requis';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'L\'étage minimum est 0';
    }
    if (control?.hasError('max') && control?.touched) {
      return 'L\'étage maximum est 200';
    }
    return '';
  }
}