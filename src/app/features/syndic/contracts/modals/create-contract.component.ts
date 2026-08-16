// src/app/features/syndic/contracts/modals/create-contract.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { ContractService } from '../access-data/contract.service';
import { ResidentService } from '../../../admin/residents/access-data/resident.service';
import { UnitService } from '../../../admin/units/access-data/unit.service';
import { SyndicBuildingService } from '../../access-data/syndic-building.service';
import { ModalComponent } from '../../../components/ui/modals/modal.component';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import { InputComponent } from '../../../components/ui/Input/input.component';
import { ToggleComponent } from '../../../components/ui/toggle/toggle.component';
import { AuthService } from '../../../../core/auth/auth.service';
import ToastService from '../../../components/ui/toast/toast.service';
import { ContractType, ContractStatus, PaymentFrequency } from '../access-data/contract.model';

@Component({
  selector: 'app-create-contract-modal',
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
      title="Créer un nouveau contrat"
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <form [formGroup]="form" (ngSubmit)="submit()">
        
        <!-- Section Localisation -->
        <div class="section-title">Localisation</div>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Bâtiment -->
          <div class="form-group">
            <label class="form-label">Bâtiment <span class="required">*</span></label>
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
            <label class="form-label">Unité <span class="required">*</span></label>
            <select 
              formControlName="unitUuid" 
              class="form-select"
              [disabled]="loadingUnits() || unitOptions().length === 0"
              (change)="onUnitChange($any($event.target).value)">
              <option value="">Sélectionnez une unité</option>
              <option *ngFor="let opt of unitOptions()" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <div *ngIf="loadingUnits()" class="loading-text">Chargement...</div>
            <span *ngIf="unitError" class="error-text">{{ unitError }}</span>
          </div>
        </div>

        <!-- Résident -->
        <div class="form-group">
          <label class="form-label">Résident <span class="required">*</span></label>
          <select 
            formControlName="residentUuid" 
            class="form-select"
            [disabled]="loadingResidents() || residentOptions().length === 0">
            <option value="">Sélectionnez un résident</option>
            <option *ngFor="let opt of residentOptions()" [value]="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <div *ngIf="loadingResidents()" class="loading-text">Chargement...</div>
          <span *ngIf="residentError" class="error-text">{{ residentError }}</span>
        </div>

        <!-- Section Type et Statut -->
        <div class="section-title">Informations du contrat</div>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Type -->
          <div class="form-group">
            <label class="form-label">Type de contrat <span class="required">*</span></label>
            <select formControlName="type" class="form-select">
              <option *ngFor="let opt of contractTypeOptions" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Statut -->
          <div class="form-group">
            <label class="form-label">Statut <span class="required">*</span></label>
            <select formControlName="status" class="form-select">
              <option *ngFor="let opt of contractStatusOptions" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Section Dates -->
        <div class="section-title">Période du contrat</div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="date-field">
            <label class="date-label">Date de début <span class="required">*</span></label>
            <input 
              type="date" 
              formControlName="startDate" 
              class="date-input"
            />
            <span *ngIf="startDateError" class="error-text">{{ startDateError }}</span>
          </div>

          <div class="date-field">
            <label class="date-label">Date de fin (optionnel)</label>
            <input 
              type="date" 
              formControlName="endDate" 
              class="date-input"
            />
          </div>
        </div>

        <!-- Section Financière -->
        <div class="section-title">Informations financières</div>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Loyer mensuel -->
          <div class="form-group">
            <label class="form-label">Loyer mensuel (MAD) <span class="required">*</span></label>
            <input
              type="number"
              formControlName="monthlyRent"
              class="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            <span *ngIf="monthlyRentError" class="error-text">{{ monthlyRentError }}</span>
          </div>

          <!-- Caution -->
          <div class="form-group">
            <label class="form-label">Caution (MAD)</label>
            <input
              type="number"
              formControlName="depositAmount"
              class="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Fréquence de paiement -->
          <div class="form-group">
            <label class="form-label">Fréquence de paiement <span class="required">*</span></label>
            <select formControlName="paymentFrequency" class="form-select">
              <option *ngFor="let opt of paymentFrequencyOptions" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Jour de paiement -->
          <div class="form-group">
            <label class="form-label">Jour de paiement (1-31)</label>
            <input
              type="number"
              formControlName="paymentDay"
              class="form-input"
              placeholder="1"
              min="1"
              max="31"
            />
          </div>
        </div>

        <!-- Toggle Caution payée -->
        <div class="toggle-field">
          <label class="toggle-label">Caution déjà payée</label>
          <app-toggle formControlName="depositPaid"></app-toggle>
        </div>

        <!-- Section Options -->
        <div class="section-title">Options</div>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Délai de préavis -->
          <div class="form-group">
            <label class="form-label">Délai de préavis (jours)</label>
            <input
              type="number"
              formControlName="renewalNoticeDays"
              class="form-input"
              placeholder="30"
              min="0"
            />
          </div>

          <!-- Toggle renouvellement auto -->
          <div class="toggle-field">
            <label class="toggle-label">Renouvellement automatique</label>
            <app-toggle formControlName="autoRenewable"></app-toggle>
          </div>
        </div>

        <!-- Termes et conditions -->
        <div class="form-group">
          <label class="form-label">Termes et conditions</label>
          <textarea
            formControlName="terms"
            class="form-textarea"
            rows="4"
            placeholder="Termes et conditions du contrat..."
          ></textarea>
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
          size="medium"
          (btnClick)="cancel()">
          Annuler
        </app-button>
        <app-button
          variant="primary"
          size="medium"
          [loading]="loading()"
          type="submit"
          [disabled]="form.invalid || loading()"
          (btnClick)="submit()">
          Créer le contrat
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

    .form-input,
    .form-select,
    .form-textarea {
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

      &:disabled {
        background: #f9fafb;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .form-textarea {
      resize: vertical;
    }

    .date-field {
      margin-bottom: 1rem;

      .date-label {
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
      margin-bottom: 1rem;

      .toggle-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin: 0;
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
export class CreateContractModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);
  private readonly residentService = inject(ResidentService);
  private readonly unitService = inject(UnitService);
  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly dialogRef = inject(MatDialogRef<CreateContractModalComponent>);

  loading = signal(false);
  loadingUnits = signal(false);
  loadingResidents = signal(false);
  
  buildingOptions = signal<{ value: string; label: string }[]>([]);
  unitOptions = signal<{ value: string; label: string }[]>([]);
  residentOptions = signal<{ value: string; label: string }[]>([]);

  form = this.fb.group({
    buildingUuid: ['', Validators.required],
    unitUuid: ['', Validators.required],
    residentUuid: ['', Validators.required],
    type: [ContractType.RENTAL, Validators.required],
    status: [ContractStatus.ACTIVE, Validators.required],
    startDate: ['', Validators.required],
    endDate: [''],
    monthlyRent: [0, [Validators.required, Validators.min(0.01)]],
    depositAmount: [0],
    paymentFrequency: [PaymentFrequency.MONTHLY, Validators.required],
    paymentDay: [1],
    depositPaid: [false],
    renewalNoticeDays: [30],
    autoRenewable: [false],
    terms: [''],
    notes: [''],
    isActive: [true]
  });

  contractTypeOptions = [
    { value: ContractType.RENTAL, label: 'Location' },
    { value: ContractType.OWNERSHIP, label: 'Propriété' },
    { value: ContractType.SUBLEASE, label: 'Sous-location' },
    { value: ContractType.COMMERCIAL, label: 'Commercial' },
    { value: ContractType.PARKING, label: 'Parking' },
    { value: ContractType.STORAGE, label: 'Stockage' }
  ];

  contractStatusOptions = [
    { value: ContractStatus.DRAFT, label: 'Brouillon' },
    { value: ContractStatus.ACTIVE, label: 'Actif' },
    { value: ContractStatus.PENDING, label: 'En attente' }
  ];

  paymentFrequencyOptions = [
    { value: PaymentFrequency.MONTHLY, label: 'Mensuel' },
    { value: PaymentFrequency.QUARTERLY, label: 'Trimestriel' },
    { value: PaymentFrequency.SEMI_ANNUAL, label: 'Semestriel' },
    { value: PaymentFrequency.ANNUAL, label: 'Annuel' }
  ];

  ngOnInit(): void {
    this.loadMyBuildings();
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
      },
      error: () => {
        this.toast.error('Erreur lors du chargement de vos bâtiments');
      }
    });
  }

  onBuildingChange(buildingUuid: string): void {
    console.log('Bâtiment sélectionné:', buildingUuid);

    if (!buildingUuid) {
      this.unitOptions.set([]);
      this.residentOptions.set([]);
      this.form.patchValue({ unitUuid: '', residentUuid: '' });
      return;
    }

    this.form.patchValue({ unitUuid: '', residentUuid: '' });
    this.loadingUnits.set(true);

    this.unitService.getUnits({ buildingUuid, active: true }).subscribe({
      next: (units) => {
        const options = units.map(u => ({ 
          value: u.uuid, 
          label: u.unitNumber 
        }));
        this.unitOptions.set(options);
        this.loadingUnits.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des unités');
        this.unitOptions.set([]);
        this.loadingUnits.set(false);
      }
    });

    // Charger aussi les résidents du bâtiment
    this.loadResidentsByBuilding(buildingUuid);
  }

  onUnitChange(unitUuid: string): void {
    console.log('Unité sélectionnée:', unitUuid);
    
    if (!unitUuid) {
      return;
    }

    // Optionnel: filtrer les résidents par unité
    // Pour l'instant on garde tous les résidents du bâtiment
  }

  private loadResidentsByBuilding(buildingUuid: string): void {
    this.loadingResidents.set(true);

    this.residentService.getResidents({ buildingUuid }).subscribe({
      next: (residents) => {
        const options = residents.map(r => ({ 
          value: r.uuid, 
          label: `${r.fullName} - ${r.unitNumber}` 
        }));
        this.residentOptions.set(options);
        this.loadingResidents.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des résidents');
        this.residentOptions.set([]);
        this.loadingResidents.set(false);
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
    const request: any = {
      residentUuid: formValue.residentUuid,
      unitUuid: formValue.unitUuid,
      type: formValue.type,
      status: formValue.status,
      startDate: formValue.startDate,
      endDate: formValue.endDate || null,
      monthlyRent: formValue.monthlyRent,
      depositAmount: formValue.depositAmount || null,
      depositPaid: formValue.depositPaid,
      paymentFrequency: formValue.paymentFrequency,
      paymentDay: formValue.paymentDay || null,
      terms: formValue.terms || null,
      notes: formValue.notes || null,
      renewalNoticeDays: formValue.renewalNoticeDays || null,
      autoRenewable: formValue.autoRenewable,
      isActive: formValue.isActive
    };

    console.log('Request payload:', request);

    this.contractService.createContract(request).subscribe({
      next: (response) => {
        console.log('Contrat créé:', response);
        this.toast.success('Contrat créé avec succès');
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur création:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la création');
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

  get residentError(): string {
    const control = this.form.get('residentUuid');
    if (control?.hasError('required') && control?.touched) {
      return 'Résident requis';
    }
    return '';
  }

  get startDateError(): string {
    const control = this.form.get('startDate');
    if (control?.hasError('required') && control?.touched) {
      return 'Date de début requise';
    }
    return '';
  }

  get monthlyRentError(): string {
    const control = this.form.get('monthlyRent');
    if (control?.hasError('required') && control?.touched) {
      return 'Loyer mensuel requis';
    }
    if (control?.hasError('min') && control?.touched) {
      return 'Le loyer doit être supérieur à 0';
    }
    return '';
  }
}