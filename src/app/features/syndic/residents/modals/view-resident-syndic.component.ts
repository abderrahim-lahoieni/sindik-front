import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalComponent } from '../../../components/ui/modals/modal.component';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import type { Resident } from '../../../admin/residents/access-data/resident.model';

@Component({
  selector: 'app-view-resident-syndic-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent
  ],
  template: `
    <app-modal
      [title]="'Détails du résident'"
      [showCloseButton]="true"
      [hasFooter]="true"
    >

      <div class="details-grid">

        <div class="field">
          <label>Nom complet</label>
          <div>{{ resident.fullName }}</div>
        </div>

        <div class="field">
          <label>Téléphone</label>
          <div>{{ resident.phoneNumber || '-' }}</div>
        </div>

        <div class="field">
          <label>Bâtiment</label>
          <div>{{ resident.buildingName }}</div>
        </div>

        <div class="field">
          <label>Unité</label>
          <div>{{ resident.unitNumber }}</div>
        </div>

        <div class="field">
          <label>Type</label>
          <div>
            {{ resident.isOwner ? 'Propriétaire' : 'Locataire' }}
          </div>
        </div>

        <div class="field">
          <label>Résident principal</label>
          <div>
            {{ resident.isPrimaryResident ? 'Oui' : 'Non' }}
          </div>
        </div>

        <div class="field">
          <label>Date d'entrée</label>
          <div>
            {{ resident.moveInDate ? (resident.moveInDate | date:'dd/MM/yyyy') : '-' }}
          </div>

        </div>
         <div class="field">
          <label>Date de sortie</label>
          <div>
            {{ resident.moveOutDate ? (resident.moveOutDate | date:'dd/MM/yyyy') : '-' }}
          </div>
        </div>

        <div class="field">
          <label>Contact urgence</label>
          <div>{{ resident.emergencyContact || '-' }}</div>
        </div>

        <div class="field">
          <label>Téléphone urgence</label>
          <div>{{ resident.emergencyPhone || '-' }}</div>
        </div>

        <div class="field full-width">
          <label>Notes</label>
          <div>{{ resident.notes || 'Aucune note' }}</div>
        </div>

      </div>

      <div modal-footer class="flex justify-end">
        <app-button (btnClick)="close()">Fermer</app-button>
      </div>

    </app-modal>
  `,
  styles: [`
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field label {
      font-weight: 600;
      font-size: 0.9rem;
      color: #64748b;
    }

    .field div {
      background: #f8fafc;
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .full-width {
      grid-column: span 2;
    }

    .flex { display: flex; }
    .justify-end { justify-content: flex-end; }
  `]
})
export class ViewResidentSyndicModalComponent {

  protected readonly dialogRef =
    inject(MatDialogRef<ViewResidentSyndicModalComponent>);

  resident: Resident;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { resident: Resident }
  ) {
    this.resident = data.resident;
  }

  close(): void {
    this.dialogRef.close();
  }
}