// src/app/features/admin/buildings/modals/manage-building-syndics.component.ts

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';

import { SyndicBuildingService } from '../../../syndic/access-data/syndic-building.service';
import { ModalComponent } from '../../../components/ui/modals/modal.component';
import { ButtonComponent } from '../../../components/ui/buttons/button.component';
import ToastService from '../../../components/ui/toast/toast.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Building } from '../access-data/building.model';
import { UserService } from '../../users/access-data/user.service';

interface SyndicOption {
  uuid: string;
  name: string;
  email: string;
  selected: boolean;
}

@Component({
  selector: 'app-manage-building-syndics',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent
  ],
  template: `
    <app-modal
      [title]="'Gérer les syndics - ' + building.name"
      [showCloseButton]="true"
      [hasFooter]="true"
       class="fixed-size-modal" 
    >
      <!-- Filtres compacts -->
      <div class="filters-compact">
        <button 
          class="filter-pill" 
          [class.active]="filter() === 'all'"
          (click)="filter.set('all')"
        >
          Tous <span class="pill-count">{{ totalSyndics() }}</span>
        </button>
        <button 
          class="filter-pill" 
          [class.active]="filter() === 'assigned'"
          (click)="filter.set('assigned')"
        >
          Assignés <span class="pill-count assigned">{{ selectedCount() }}</span>
        </button>
        <button 
          class="filter-pill" 
          [class.active]="filter() === 'available'"
          (click)="filter.set('available')"
        >
          Dispos <span class="pill-count available">{{ availableCount() }}</span>
        </button>
        
        @if (hasChanges()) {
          <div class="action-buttons">
            <button class="reset-mini" (click)="resetChanges()" title="Réinitialiser">
              ↺
            </button>
            <span class="changes-mini">{{ pendingChangesCount() }}</span>
          </div>
        }
      </div>

      <!-- Loading -->
      @if (loadingSyndics()) {
        <div class="loading-mini">
          <div class="spinner-mini"></div>
          <span>Chargement...</span>
        </div>
      }

      <!-- Liste mini cartes avec scrollbar amélioré -->
      @if (!loadingSyndics() && filteredSyndics().length > 0) {
        <div class="cards-container">
          <div class="cards-mini" #scrollContainer>
            @for (s of filteredSyndics(); track s.uuid) {
              <div 
                class="card-mini"
                [class.selected]="s.selected"
                (click)="toggleSyndic(s)"
              >
                <div class="card-left">
                  <div class="avatar-mini">{{ getInitials(s.name) }}</div>
                  <div class="info-mini">
                    <div class="name-mini">{{ s.name }}</div>
                    <div class="email-mini">{{ s.email }}</div>
                  </div>
                </div>
                
                <div class="card-right">
                  @if (s.selected) {
                    <div class="badge-mini assigned">✓</div>
                  } @else {
                    <div class="badge-mini"></div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Empty -->
      @if (!loadingSyndics() && filteredSyndics().length === 0) {
        <div class="empty-mini">
          <span>Aucun syndic</span>
        </div>
      }

      <!-- Barre action -->
      

      <!-- Footer -->
      <div modal-footer class="footer-mini">
        <app-button
          variant="primary"
          [loading]="loading()"
          [disabled]="loading() || !hasChanges()"
          (btnClick)="submit()"
          class="btn-save-mini"
        >
          @if (hasChanges()) {
            Enregistrer ({{ pendingChangesCount() }})
          } @else {
            Enregistrer
          }
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`

    /* Filtres compacts */
    .filters-compact {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #edf2f7;
    }

    .filter-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 30px;
      background: white;
      font-size: 0.85rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;

      .pill-count {
        padding: 0.125rem 0.375rem;
        border-radius: 20px;
        background: #f1f5f9;
        color: #475569;
        font-size: 0.75rem;
        font-weight: 600;
        transition: all 0.2s;

        &.assigned { color: #ffc312; }
        &.available { color: #10b981; }
      }

      &:hover {
        border-color: #ffc312;
        color: #ffc312;

        .pill-count {
          background: #ffc312;
          color: white;
        }
      }

      &.active {
        background: #ffc312;
        border-color: #ffc312;
        color: white;

        .pill-count {
          background: rgba(255,255,255,0.2);
          color: white;
        }
      }
    }

    /* Loading mini */
    .loading-mini {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .spinner-mini {
      width: 20px;
      height: 20px;
      border: 2px solid #e2e8f0;
      border-top-color: #ffc312;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Container avec scrollbar amélioré */
    .cards-container {
      position: relative;
      padding: 0.5rem 0;
    }

    .cards-mini {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      padding: 0.5rem 1.5rem;
      max-height: 300px;
      overflow-y: auto;
      
      /* Scrollbar large et facile à attraper */
      scrollbar-width: auto;
      scrollbar-color: #ffc312 #e2e8f0;
      
      &::-webkit-scrollbar {
        width: 12px; /* Plus large pour faciliter le scroll */
      }

      &::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 20px;
        margin: 4px 0;
        border: 2px solid white;
      }

      &::-webkit-scrollbar-thumb {
        background: #ffc312;
        border-radius: 20px;
        border: 3px solid #f1f5f9; /* Crée un espace autour */
        min-height: 50px; /* Minimum height for easy grabbing */
        
        &:hover {
          background: #e6b010;
        }
        
        &:active {
          background: #d4a00e;
        }
      }

      /* Effet de gradient pour indiquer le scroll */
      mask-image: linear-gradient(to bottom, transparent, black 5%, black 95%, transparent);
    }

    /* Indicateur de scroll */
    .scroll-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem;
      margin: 0 1.5rem 0.5rem 1.5rem;
      background: #f8fafc;
      border-radius: 20px;
      border: 1px dashed #cbd5e1;
      color: #64748b;
      font-size: 0.75rem;
      animation: bounce 2s infinite;

      .scroll-icon {
        font-size: 0.8rem;
      }

      .scroll-text {
        font-weight: 500;
      }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-3px); }
      60% { transform: translateY(-1px); }
    }
      /* Fixer la taille du modal */
    :host ::ng-deep .fixed-size-modal .modal-panel {
      width: 500px !important;
      height: 550px !important;
      max-height: 550px !important;
      overflow: hidden !important;
    }

    :host ::ng-deep .fixed-size-modal .modal-content {
      height: calc(100% - 130px) !important; /* Ajuster selon l'en-tête et footer */
      overflow: hidden !important;
    }

    /* Container avec hauteur fixe */
    .cards-mini {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      padding: 0.5rem 1.5rem;
      height: 350px;  /* Hauteur fixe pour la liste */
      overflow-y: auto;
      
      /* Scrollbar styles */
      scrollbar-width: auto;
      scrollbar-color: #ffc312 #e2e8f0;
      
      &::-webkit-scrollbar {
        width: 12px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 20px;
        margin: 4px 0;
        border: 2px solid white;
      }

      &::-webkit-scrollbar-thumb {
        background: #ffc312;
        border-radius: 20px;
        border: 3px solid #f1f5f9;
        min-height: 50px;
        
        &:hover {
          background: #e6b010;
        }
        
        &:active {
          background: #d4a00e;
        }
      }
    }

    /* Cartes sans hauteur fixe */
    .card-mini {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 0.75rem;
      background: white;
      border: 1px solid #edf2f7;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      margin-right: 0.5rem;
      height: auto;  /* Hauteur automatique */
      min-height: 50px;  /* Hauteur minimale */

      &:hover {
        border-color: #ffc312;
        background: #fffaf0;
        transform: translateX(2px);
      }

      &.selected {
        border-color: #ffc312;
        background: #fffaf0;
      }

      .card-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
        flex: 1;
      }

      .avatar-mini {
        width: 32px;
        height: 32px;
        background: #f1f5f9;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.8rem;
        color: #475569;
        flex-shrink: 0;
        transition: all 0.2s;
      }

      .info-mini {
        min-width: 0;
        flex: 1;
      }

      .name-mini {
        font-weight: 500;
        color: #0f172a;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .email-mini {
        font-size: 0.75rem;
        color: #94a3b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-right {
        flex-shrink: 0;
      }

      .badge-mini {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: bold;

        &.assigned {
          background: #ffc312;
          color: white;
        }
      }

      &.selected .avatar-mini {
        background: #ffc312;
        color: white;
      }
    }

    /* Empty mini avec hauteur fixe */
    .empty-mini {
      height: 350px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.9rem;
    }

    

    /* Liste mini cartes */
    .card-mini {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 0.75rem;
      background: white;
      border: 1px solid #edf2f7;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      margin-right: 0.5rem; /* Espace pour le scrollbar */

      &:hover {
        border-color: #ffc312;
        background: #fffaf0;
        transform: translateX(2px);
      }

      &.selected {
        border-color: #ffc312;
        background: #fffaf0;
      }

      .card-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
        flex: 1;
      }

      .avatar-mini {
        width: 32px;
        height: 32px;
        background: #f1f5f9;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.8rem;
        color: #475569;
        flex-shrink: 0;
        transition: all 0.2s;
      }

      .info-mini {
        min-width: 0;
        flex: 1;
      }

      .name-mini {
        font-weight: 500;
        color: #0f172a;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .email-mini {
        font-size: 0.75rem;
        color: #94a3b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-right {
        flex-shrink: 0;
      }

      .badge-mini {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: bold;

        &.assigned {
          background: #ffc312;
          color: white;
        }
      }

      &.selected .avatar-mini {
        background: #ffc312;
        color: white;
      }
    }    
    /* Empty mini - MODIFIER ICI */
    .empty-mini {
      height: 320px;  /* AJOUTER height: 320px; */
      padding: 2rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.9rem;
    }

    /* Barre action */
    .action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      border-top: 1px solid #edf2f7;
      border-bottom: 1px solid #edf2f7;
      background: #fafbfc;
    }

    .selected-mini {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #64748b;

      .selected-badge {
        background: #ffc312;
        color: white;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.8rem;
      }
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
    }

    .reset-mini {
      width: 28px;
      height: 28px;
      border: 1px solid #e2e8f0;
      border-radius: 50%;
      background: white;
      color: #64748b;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #ffc312;
        color: #ffc312;
        transform: rotate(180deg);
      }
    }

    .changes-mini {
      background: #3b82f6;
      color: white;
      padding: 0.125rem 0.375rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    /* Footer mini */
    .footer-mini {
      width: 50%;
      display: flex;
      justify-content: flex-end;
    }

    .btn-save-mini {
      min-width: 100px;
    }
  `]
})
export class ManageBuildingSyndicsModalComponent implements OnInit {

  private readonly syndicBuildingService = inject(SyndicBuildingService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);

  protected readonly dialogRef = inject(MatDialogRef<ManageBuildingSyndicsModalComponent>);
  private readonly modalData = inject<{ building: Building }>(MAT_DIALOG_DATA);

  building: Building;

  // Signals
  loading = signal(false);
  loadingSyndics = signal(true);
  syndics = signal<SyndicOption[]>([]);
  filter = signal<'all' | 'assigned' | 'available'>('all');
  
  private originallyAssigned: string[] = [];

  // Computed
  totalSyndics = computed(() => this.syndics().length);
  selectedCount = computed(() => this.syndics().filter(s => s.selected).length);
  availableCount = computed(() => this.totalSyndics() - this.selectedCount());

  filteredSyndics = computed(() => {
    let filtered = this.syndics();
    
    switch (this.filter()) {
      case 'assigned':
        filtered = filtered.filter(s => s.selected);
        break;
      case 'available':
        filtered = filtered.filter(s => !s.selected);
        break;
    }
    
    return filtered;
  });

  hasChanges = computed(() => {
    const current = this.syndics().filter(s => s.selected).map(s => s.uuid).sort();
    return JSON.stringify(current) !== JSON.stringify([...this.originallyAssigned].sort());
  });

  pendingChangesCount = computed(() => {
    const current = this.syndics().filter(s => s.selected).map(s => s.uuid);
    const toAdd = current.filter(id => !this.originallyAssigned.includes(id));
    const toRemove = this.originallyAssigned.filter(id => !current.includes(id));
    return toAdd.length + toRemove.length;
  });

  constructor() {
    this.building = this.modalData.building;
  }

  ngOnInit(): void {
    this.loadSyndics();
  }

  private loadSyndics(): void {
    forkJoin({
      allSyndics: this.userService.getUsersByRole('SYNDIC'),
      assigned: this.syndicBuildingService.getSyndicsByBuilding(this.building.uuid)
    }).subscribe({
      next: ({ allSyndics, assigned }) => {
        const assignedUuids = assigned.map(a => a.syndicUuid);
        this.originallyAssigned = [...assignedUuids];

        this.syndics.set(allSyndics.map(user => ({
          uuid: user.uuid,
          name: user.fullName,
          email: user.email,
          selected: assignedUuids.includes(user.uuid)
        })));

        this.loadingSyndics.set(false);
      },
      error: () => {
        this.toast.error('Erreur chargement');
        this.loadingSyndics.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  toggleSyndic(s: SyndicOption): void {
    s.selected = !s.selected;
    this.syndics.update(list => [...list]);
  }

  resetChanges(): void {
    this.syndics.update(list => 
      list.map(s => ({ ...s, selected: this.originallyAssigned.includes(s.uuid) }))
    );
    this.toast.info('Modifications annulées');
  }

  submit(): void {
    const current = this.syndics().filter(s => s.selected).map(s => s.uuid);
    const toAssign = current.filter(id => !this.originallyAssigned.includes(id));
    const toRemove = this.originallyAssigned.filter(id => !current.includes(id));

    this.loading.set(true);

    const ops = [
      ...toAssign.map(uuid => 
        this.syndicBuildingService.assignSyndicToBuildings({
          syndicUuid: uuid,
          buildingUuids: [this.building.uuid],
          assignedBy: this.auth.getUsernameUUid() ?? undefined
        })
      ),
      ...toRemove.map(uuid => 
        this.syndicBuildingService.removeSyndicFromBuilding(uuid, this.building.uuid)
      )
    ];

    forkJoin(ops).subscribe({
      next: () => {
        this.toast.success('Mise à jour réussie');
        this.dialogRef.close(true);
      },
      error: () => {
        this.toast.error('Erreur');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}