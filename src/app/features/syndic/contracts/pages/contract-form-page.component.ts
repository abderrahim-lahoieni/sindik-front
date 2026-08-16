// src/app/features/syndic/contracts/pages/contract-form-page.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ContractService } from '../access-data/contract.service';
import { ResidentService } from '../../../admin/residents/access-data/resident.service';
import { UnitService } from '../../../admin/units/access-data/unit.service';
import { SyndicBuildingService } from '../../access-data/syndic-building.service';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import { AuthService } from '../../../../core/auth/auth.service';
import ToastService from '../../../components/ui/toast/toast.service';
import { ModalService } from '../../../components/ui/modals/modal.service';
import { Contract, ContractType, ContractStatus, PaymentFrequency } from '../access-data/contract.model';

@Component({
  selector: 'app-contract-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent
  ],
  templateUrl: './contract-form-page.component.html',
  styleUrls: ['./contract-form-page.component.scss']
})
export class ContractFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);
  private readonly residentService = inject(ResidentService);
  private readonly unitService = inject(UnitService);
  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly modal = inject(ModalService);

  // Mode: 'create' ou 'edit'
  mode = signal<'create' | 'edit'>('create');
  
  loading = signal(false);
  loadingContract = signal(false);
  loadingUnits = signal(false);
  loadingResidents = signal(false);
  
  contract = signal<Contract | null>(null);
  contractUuid: string | null = null;
  initialFormValue: any;
  
  buildingOptions = signal<{ value: string; label: string }[]>([]);
  unitOptions = signal<{ value: string; label: string }[]>([]);
  residentOptions = signal<{ value: string; label: string }[]>([]);

  // Étapes du formulaire
  currentStep = signal(1);
  totalSteps = 4;

  form = this.fb.group({
    // Step 1: Localisation
    buildingUuid: ['', Validators.required],
    unitUuid: ['', Validators.required],
    residentUuid: ['', Validators.required],
    
    // Step 2: Type et Dates
    type: [ContractType.RENTAL, Validators.required],
    status: [ContractStatus.ACTIVE, Validators.required],
    startDate: ['', Validators.required],
    endDate: [''],
    
    // Step 3: Financier
    monthlyRent: [0, [Validators.required, Validators.min(0.01)]],
    depositAmount: [0],
    paymentFrequency: [PaymentFrequency.MONTHLY, Validators.required],
    paymentDay: [1, [Validators.min(1), Validators.max(31)]],
    depositPaid: [false],
    
    // Step 4: Options et Notes
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
    { value: ContractStatus.PENDING, label: 'En attente' },
    { value: ContractStatus.EXPIRED, label: 'Expiré' },
    { value: ContractStatus.TERMINATED, label: 'Résilié' },
    { value: ContractStatus.RENEWED, label: 'Renouvelé' }
  ];

  paymentFrequencyOptions = [
    { value: PaymentFrequency.MONTHLY, label: 'Mensuel' },
    { value: PaymentFrequency.QUARTERLY, label: 'Trimestriel' },
    { value: PaymentFrequency.SEMI_ANNUAL, label: 'Semestriel' },
    { value: PaymentFrequency.ANNUAL, label: 'Annuel' }
  ];

  ngOnInit(): void {
    // Déterminer le mode selon la route
    this.contractUuid = this.route.snapshot.paramMap.get('uuid');
    
    if (this.contractUuid) {
      this.mode.set('edit');
      this.loadContract();
    } else {
      this.mode.set('create');
      this.loadMyBuildings();
    }
  }

  private loadContract(): void {
    if (!this.contractUuid) return;

    this.loadingContract.set(true);

    this.contractService.getContractByUuid(this.contractUuid).subscribe({
      next: (contract) => {
        this.contract.set(contract);
        this.initFormForEdit(contract);
        this.loadingContract.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du chargement du contrat');
        this.router.navigate(['/syndik/contracts']);
      }
    });
  }

  private initFormForEdit(contract: Contract): void {
    const startDate = contract.startDate 
      ? new Date(contract.startDate).toISOString().split('T')[0]
      : '';
    
    const endDate = contract.endDate 
      ? new Date(contract.endDate).toISOString().split('T')[0]
      : '';

    // En mode édition, on désactive les champs de localisation
    this.form.get('buildingUuid')?.disable();
    this.form.get('unitUuid')?.disable();
    this.form.get('residentUuid')?.disable();

    this.form.patchValue({
      buildingUuid: contract.buildingUuid,
      unitUuid: contract.unitUuid,
      residentUuid: contract.residentUuid,
      type: contract.type,
      status: contract.status,
      startDate,
      endDate,
      monthlyRent: contract.monthlyRent,
      depositAmount: contract.depositAmount || 0,
      depositPaid: contract.depositPaid,
      paymentFrequency: contract.paymentFrequency,
      paymentDay: contract.paymentDay || 1,
      renewalNoticeDays: contract.renewalNoticeDays || 0,
      autoRenewable: contract.autoRenewable,
      terms: contract.terms || '',
      notes: contract.notes || '',
      isActive: contract.isActive
    });

    this.initialFormValue = this.form.getRawValue(); // getRawValue pour inclure les champs disabled
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

  onBuildingChange(event: Event): void {
    const buildingUuid = (event.target as HTMLSelectElement).value;
    
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

    this.loadResidentsByBuilding(buildingUuid);
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

  // Navigation entre étapes
  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      if (this.isStepValid(this.currentStep())) {
        this.currentStep.set(this.currentStep() + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.toast.error('Veuillez remplir tous les champs obligatoires');
        this.markStepAsTouched(this.currentStep());
      }
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        if (this.mode() === 'edit') return true; // En mode edit, step 1 est toujours valide
        return this.form.get('buildingUuid')?.valid === true &&
               this.form.get('unitUuid')?.valid === true &&
               this.form.get('residentUuid')?.valid === true;
      case 2:
        return this.form.get('type')?.valid === true &&
               this.form.get('status')?.valid === true &&
               this.form.get('startDate')?.valid === true;
      case 3:
        return this.form.get('monthlyRent')?.valid === true &&
               this.form.get('paymentFrequency')?.valid === true;
      case 4:
        return true;
      default:
        return false;
    }
  }

  private markStepAsTouched(step: number): void {
    switch (step) {
      case 1:
        this.form.get('buildingUuid')?.markAsTouched();
        this.form.get('unitUuid')?.markAsTouched();
        this.form.get('residentUuid')?.markAsTouched();
        break;
      case 2:
        this.form.get('type')?.markAsTouched();
        this.form.get('status')?.markAsTouched();
        this.form.get('startDate')?.markAsTouched();
        break;
      case 3:
        this.form.get('monthlyRent')?.markAsTouched();
        this.form.get('paymentFrequency')?.markAsTouched();
        break;
    }
  }

  hasChanges(): boolean {
    if (this.mode() === 'create') return true;
    return JSON.stringify(this.form.getRawValue()) !== JSON.stringify(this.initialFormValue);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.mode() === 'edit' && !this.hasChanges()) {
      this.toast.info('Aucune modification détectée');
      return;
    }

    this.loading.set(true);

    if (this.mode() === 'create') {
      this.createContract();
    } else {
      this.updateContract();
    }
  }

  private createContract(): void {
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

    this.contractService.createContract(request).subscribe({
      next: () => {
        this.toast.success('Contrat créé avec succès');
        this.router.navigate(['/syndik/contracts']);
      },
      error: (err) => {
        console.error('Erreur création:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la création');
        this.loading.set(false);
      }
    });
  }

  private updateContract(): void {
    if (!this.contractUuid) return;

    const formValue = this.form.getRawValue();
    const request: any = {};

    // Envoyer seulement les champs modifiés
    Object.keys(formValue).forEach(key => {
      if (formValue[key as keyof typeof formValue] !== this.initialFormValue[key]) {
        request[key] = formValue[key as keyof typeof formValue] === '' ? null : formValue[key as keyof typeof formValue];
      }
    });

    this.contractService.updateContract(this.contractUuid, request).subscribe({
      next: () => {
        this.toast.success('Contrat modifié avec succès');
        this.router.navigate(['/syndik/contracts']);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.toast.error(err.error?.error || 'Erreur lors de la modification');
        this.loading.set(false);
      }
    });
  }

  confirmDelete(): void {
    const contractNumber = this.contract()?.contractNumber || 'ce contrat';
    
    this.modal.confirm({
      title: 'Supprimer le contrat',
      message: `Êtes-vous sûr de vouloir supprimer ${contractNumber} ? Cette action est irréversible.`,
      confirmText: 'Oui, supprimer',
      cancelText: 'Annuler'
    }).subscribe((confirmed: boolean) => {
      if (confirmed && this.contractUuid) {
        this.contractService.deleteContract(this.contractUuid).subscribe({
          next: () => {
            this.toast.success('Contrat supprimé avec succès');
            this.router.navigate(['/syndik/contracts']);
          },
          error: (err) => {
            console.error('Erreur suppression:', err);
            this.toast.error(err.error?.error || 'Erreur lors de la suppression');
          }
        });
      }
    });
  }

  cancel(): void {
    if (this.hasChanges()) {
      this.modal.confirm({
        title: 'Annuler les modifications',
        message: 'Êtes-vous sûr de vouloir quitter ? Les modifications non enregistrées seront perdues.',
        confirmText: 'Oui, quitter',
        cancelText: 'Non, rester'
      }).subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.router.navigate(['/syndik/contracts']);
        }
      });
    } else {
      this.router.navigate(['/syndik/contracts']);
    }
  }

  // Helpers
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

  get pageTitle(): string {
    return this.mode() === 'create' ? 'Créer un nouveau contrat' : `Modifier le contrat ${this.contract()?.contractNumber || ''}`;
  }

  get submitButtonText(): string {
    return this.mode() === 'create' ? 'Créer le contrat' : 'Enregistrer les modifications';
  }
}