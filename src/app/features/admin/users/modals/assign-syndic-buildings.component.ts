// src/app/features/admin/users/modals/assign-syndic-buildings.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SyndicBuildingService } from '../../../syndic/access-data/syndic-building.service';
import { BuildingService } from '../../buildings/access-data/building.service';

import { User } from '../access-data/user.model';
import {ModalComponent} from '../../../components/ui/modals/modal.component';
import {ButtonComponent} from '../../../components/ui/buttons/button.component';
import {InputComponent} from '../../../components/ui/Input/input.component';
import {AuthService} from '../../../../core/auth/auth.service';
import ToastService from '../../../components/ui/toast/toast.service';

interface BuildingOption {
  uuid: string;
  name: string;
  residenceName: string;
  selected: boolean;
}

@Component({
  selector: 'app-assign-syndic-buildings-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    ModalComponent
  ],
  template: `
    <app-modal
      [title]="'Assigner des bâtiments à ' + syndic.fullName"
      [showCloseButton]="true"
      [hasFooter]="true"
    >
      <div class="modal-content">
        <!-- Loading State -->
        <div *ngIf="loadingBuildings()" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des bâtiments...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loadingBuildings() && buildings().length === 0" class="empty-state">
          <p>Aucun bâtiment disponible</p>
        </div>

        <!-- Buildings Selection -->
        <div *ngIf="!loadingBuildings() && buildings().length > 0" class="buildings-selection">
          <div class="selection-header">
            <h3>Sélectionnez les bâtiments à assigner</h3>
          </div>
          <div class="buildings-list">
            <div
              *ngFor="let building of buildings()"
              class="building-item"
              [class.selected]="building.selected"
              (click)="toggleBuilding(building)">

              <div class="building-checkbox">
                <input
                  type="checkbox"
                  [checked]="building.selected"
                  (click)="$event.stopPropagation()">
              </div>

              <div class="building-info">
                <div class="building-name">{{ building.name }}</div>
                <div class="building-residence">{{ building.residenceName }}</div>
              </div>

              <div class="building-status" *ngIf="building.selected">
                <span class="status-badge">✓ Sélectionné</span>
              </div>
            </div>
          </div>

          <div class="selection-summary">
            <span class="summary-text">
              {{ getSelectedCount() }} bâtiment(s) sélectionné(s)
            </span>
          </div>
        </div>

      </div>

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
          [disabled]="getSelectedCount() === 0 || loading()"
          (btnClick)="submit()">
          Assigner {{ getSelectedCount() > 0 ? '(' + getSelectedCount() + ')' : '' }}
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    .modal-content {
      max-height: 600px;
      overflow-y: auto;
    }

    .syndic-info {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;

      .info-item {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          font-weight: 600;
          color: #64748b;
        }

        .info-value {
          color: #0f172a;
          font-weight: 500;
        }
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e2e8f0;
        border-top-color: #ffc312;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      p {
        margin-top: 1rem;
        color: #64748b;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #64748b;
    }

    .buildings-selection {
      .selection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e2e8f0;

        h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }

        .selection-actions {
          display: flex;
          gap: 0.5rem;

          button {
            padding: 0.5rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: white;
            color: #64748b;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              border-color: #ffc312;
              color: #ffc312;
              background: rgba(255, 195, 18, 0.05);
            }
          }
        }
      }

      .buildings-list {
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 1rem;

        .building-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            border-color: #ffc312;
            background: rgba(255, 195, 18, 0.05);
          }

          &.selected {
            border-color: #ffc312;
            background: rgba(255, 195, 18, 0.1);
          }

          .building-checkbox {
            input[type="checkbox"] {
              width: 20px;
              height: 20px;
              cursor: pointer;
              accent-color: #ffc312;
            }
          }

          .building-info {
            flex: 1;

            .building-name {
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 0.25rem;
            }

            .building-residence {
              font-size: 0.875rem;
              color: #64748b;
            }
          }

          .building-status {
            .status-badge {
              display: inline-block;
              padding: 0.25rem 0.75rem;
              background: #ffc312;
              color: white;
              border-radius: 12px;
              font-size: 0.75rem;
              font-weight: 600;
            }
          }
        }
      }

      .selection-summary {
        text-align: center;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;

        .summary-text {
          font-weight: 600;
          color: #ffc312;
          font-size: 1rem;
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
  `]
})
export class AssignSyndicBuildingsModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly buildingService = inject(BuildingService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly dialogRef = inject(MatDialogRef<AssignSyndicBuildingsModalComponent>);
  private readonly modalData = inject<{ syndic: User }>(MAT_DIALOG_DATA);
  private originallyAssigned: string[] = [];

  loading = signal(false);
  loadingBuildings = signal(true);
  buildings = signal<BuildingOption[]>([]);
  syndic: User;

  constructor() {
    this.syndic = this.modalData.syndic;
  }

  ngOnInit(): void {
    this.loadAvailableBuildings();
  }

  private loadAvailableBuildings(): void {
    this.loadingBuildings.set(true);

    // Charger tous les bâtiments actifs
   this.buildingService.getBuildings({ active: true }).subscribe({
  next: (buildings) => {

    const buildingOptions: BuildingOption[] = buildings.map(b => ({
      uuid: b.uuid,
      name: b.name,
      residenceName: b.residenceName,
      selected: false
    }));

    // Charger les bâtiments déjà assignés à ce syndic
    this.syndicBuildingService.getBuildingsBySyndic(this.syndic.uuid).subscribe({
      next: (assignedBuildings) => {

        const assignedUuids = assignedBuildings.map(ab => ab.buildingUuid);

        // 🔥 IMPORTANT : sauvegarder l’état initial
        this.originallyAssigned = [...assignedUuids];

        buildingOptions.forEach(building => {
          building.selected = assignedUuids.includes(building.uuid);
        });

        this.buildings.set(buildingOptions);
        this.loadingBuildings.set(false);
      },
      error: () => {
        this.buildings.set(buildingOptions);
        this.loadingBuildings.set(false);
      }
    });
  },
  error: () => {
    this.toast.error('Erreur lors du chargement des bâtiments');
    this.loadingBuildings.set(false);
  }
});
  }

  toggleBuilding(building: BuildingOption): void {
    building.selected = !building.selected;
    this.buildings.set([...this.buildings()]);
  }


  getSelectedCount(): number {
    return this.buildings().filter(b => b.selected).length;
  }

 submit(): void {
  const currentSelected = this.buildings()
    .filter(b => b.selected)
    .map(b => b.uuid);

  const toAssign = currentSelected.filter(
    uuid => !this.originallyAssigned.includes(uuid)
  );

  const toRemove = this.originallyAssigned.filter(
    uuid => !currentSelected.includes(uuid)
  );

  if (toAssign.length === 0 && toRemove.length === 0) {
    this.toast.info('Aucune modification détectée');
    return;
  }

  this.loading.set(true);

  const operations: any[] = [];

  // ➕ Assignations
  if (toAssign.length > 0) {
    operations.push(
      this.syndicBuildingService.assignSyndicToBuildings({
        syndicUuid: this.syndic.uuid,
        buildingUuids: toAssign,
        assignedBy: this.auth.getUsernameUUid() ?? undefined
      })
    );
  }

  // ➖ Suppressions
  toRemove.forEach(uuid => {
    operations.push(
      this.syndicBuildingService.removeSyndicFromBuilding(
        this.syndic.uuid,
        uuid
      )
    );
  });

  import('rxjs').then(rxjs => {
    rxjs.forkJoin(operations).subscribe({
      next: () => {
        this.toast.success('Modifications enregistrées avec succès');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erreur lors de la mise à jour');
        this.loading.set(false);
      }
    });
  });
}

  cancel(): void {
    this.dialogRef.close();
  }
}
