// src/app/features/syndic/contracts/pages/view-contract-page.component.ts

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ButtonComponent } from '../../../../components/ui/buttons/button.component';
import { ContractService } from '../../access-data/contract.service';
import ToastService from '../../../../components/ui/toast/toast.service';
import { Contract, ContractStatus, ContractType, PaymentFrequency } from '../../access-data/contract.model';

@Component({
    selector: 'app-view-contract-page',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    template: `
    <div class="view-contract-page">

      <!-- ===== PAGE HEADER ===== -->
      <div class="page-header">
        <div class="header-content">

          <button class="btn-back" (click)="goBack()">
            <span class="material-icons">arrow_back</span>
          </button>

          <div class="header-text">
            <h1>{{ contract()?.contractNumber || 'Détails du contrat' }}</h1>
            <p class="subtitle">Visualisez les informations du contrat</p>
          </div>

          <div class="header-actions">

            <!-- Aperçu / Retour aux détails -->
            <button
              class="btn-action"
              [class.btn-preview]="!showPreview()"
              [class.btn-details]="showPreview()"
              (click)="togglePreview()"
              [disabled]="!contract()"
            >
              <span class="material-icons">{{ showPreview() ? 'list_alt' : 'preview' }}</span>
              <span class="btn-text">{{ showPreview() ? 'Voir détails' : 'Aperçu PDF' }}</span>
            </button>

            <!-- Télécharger -->
            <button
              class="btn-action btn-download"
              (click)="downloadPdf()"
              [disabled]="!contract() || downloadLoading()"
            >
              <span class="material-icons">{{ downloadLoading() ? 'hourglass_empty' : 'download' }}</span>
              <span class="btn-text">{{ downloadLoading() ? 'En cours...' : 'Télécharger PDF' }}</span>
            </button>

            <!-- Modifier -->
            <button class="btn-action btn-edit" (click)="editContract()" [disabled]="!contract()">
              <span class="material-icons">edit</span>
              <span class="btn-text">Modifier</span>
            </button>

          </div>
        </div>
      </div>

      <!-- ===== LOADING ===== -->
      <div *ngIf="loading()" class="loading-container">
        <div class="spinner"></div>
        <p>Chargement du contrat...</p>
      </div>

      <!-- ===== ZONE DE CONTENU (détails OU aperçu PDF) ===== -->
      <div *ngIf="!loading() && contract()" class="content-area">

        <!-- ─── VUE DÉTAILS ─── -->
        <ng-container *ngIf="!showPreview()">
            <div> </div>
           <div> </div>

          <!-- Informations générales -->
          <div class="info-section">
            <h2 class="section-title">
              <span class="material-icons">info</span>
              Informations générales
            </h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Numéro de contrat</span>
                <span class="value">{{ contract()?.contractNumber }}</span>
              </div>
              <div class="info-item">
                <span class="label">Type</span>
                <span class="value badge badge-type">{{ getTypeLabel(contract()?.type) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Statut</span>
                <span class="value badge" [ngClass]="getStatusClass(contract()?.status)">
                  {{ getStatusLabel(contract()?.status) }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">Actif</span>
                <span class="value">{{ contract()?.isActive ? 'Oui' : 'Non' }}</span>
              </div>
            </div>
          </div>

          <!-- Parties -->
          <div class="info-section">
            <h2 class="section-title">
              <span class="material-icons">people</span>
              Parties du contrat
            </h2>
            <div class="parties-grid">
              <div class="party-card">
                <h3>Bailleur</h3>
                <p class="party-name">Syndic de {{ contract()?.residenceName }}</p>
              </div>
              <div class="party-card">
                <h3>Preneur</h3>
                <p class="party-name">{{ contract()?.residentName }}</p>
              </div>
            </div>
          </div>

          <!-- Bien loué -->
          <div class="info-section">
            <h2 class="section-title">
              <span class="material-icons">home</span>
              Bien loué
            </h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Résidence</span>
                <span class="value">{{ contract()?.residenceName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Bâtiment</span>
                <span class="value">{{ contract()?.buildingName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Unité</span>
                <span class="value">{{ contract()?.unitNumber }}</span>
              </div>
            </div>
          </div>

          <!-- Période -->
          <div class="info-section">
            <h2 class="section-title">
              <span class="material-icons">event</span>
              Période
            </h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Date de début</span>
                <span class="value">{{ formatDate(contract()?.startDate) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Date de fin</span>
                <span class="value">
                  {{ contract()?.endDate ? formatDate(contract()?.endDate) : 'Indéterminée' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Financier -->
          <div class="info-section">
            <h2 class="section-title">
              <span class="material-icons">payments</span>
              Informations financières
            </h2>
            <div class="financial-grid">
              <div class="financial-card primary">
                <span class="financial-label">Loyer mensuel</span>
                <span class="financial-value">
                  {{ contract()?.monthlyRent?.toLocaleString('fr-FR') }} MAD
                </span>
              </div>
              <div class="financial-card">
                <span class="financial-label">Caution</span>
                <span class="financial-value">
                  {{ contract()?.depositAmount
                      ? contract()?.depositAmount?.toLocaleString('fr-FR') + ' MAD'
                      : 'Non spécifiée' }}
                </span>
                <span class="financial-status" *ngIf="contract()?.depositAmount">
                  {{ contract()?.depositPaid ? '✓ Payée' : '✗ Non payée' }}
                </span>
              </div>
              <div class="financial-card">
                <span class="financial-label">Fréquence</span>
                <span class="financial-value">{{ getFrequencyLabel(contract()?.paymentFrequency) }}</span>
              </div>
              <div class="financial-card" *ngIf="contract()?.paymentDay">
                <span class="financial-label">Jour de paiement</span>
                <span class="financial-value">Le {{ contract()?.paymentDay }} du mois</span>
              </div>
            </div>
          </div>

          <!-- Options -->
          <div class="info-section" *ngIf="contract()?.renewalNoticeDays || contract()?.autoRenewable">
            <h2 class="section-title">
              <span class="material-icons">settings</span>
              Options
            </h2>
            <div class="info-grid">
              <div class="info-item" *ngIf="contract()?.renewalNoticeDays">
                <span class="label">Délai de préavis</span>
                <span class="value">{{ contract()?.renewalNoticeDays }} jours</span>
              </div>
              <div class="info-item">
                <span class="label">Renouvellement automatique</span>
                <span class="value">{{ contract()?.autoRenewable ? 'Oui' : 'Non' }}</span>
              </div>
            </div>
          </div>

          <!-- Termes -->
          <div class="info-section" *ngIf="contract()?.terms">
            <h2 class="section-title">
              <span class="material-icons">description</span>
              Termes et conditions
            </h2>
            <div class="terms-box">
              <p>{{ contract()?.terms }}</p>
            </div>
          </div>

          <!-- Notes -->
          <div class="info-section" *ngIf="contract()?.notes">
            <h2 class="section-title">
              <span class="material-icons">note</span>
              Notes
            </h2>
            <div class="notes-box">
              <p>{{ contract()?.notes }}</p>
            </div>
          </div>

        </ng-container>
        <!-- FIN VUE DÉTAILS -->
          <div> </div>
           <div> </div>

        <!-- ─── VUE APERÇU PDF ─── -->
        <div class="pdf-view" *ngIf="showPreview()">
          <!-- Loading -->
          <div class="pdf-loading" *ngIf="previewLoading()">
            <div class="spinner"></div>
            <p>Génération de l'aperçu PDF...</p>
          </div>
          <!-- Iframe PDF -->
          <iframe
            *ngIf="!previewLoading() && safePdfUrl()"
            [src]="safePdfUrl()!"
            class="pdf-iframe"
            title="Aperçu contrat PDF"
          ></iframe>

        </div>
        <!-- FIN VUE APERÇU PDF -->

      </div>

    </div>
  `,
    styleUrls: ['./view-contract-page.component.scss']
})
export class ViewContractPageComponent implements OnInit, OnDestroy {

    private readonly contractService = inject(ContractService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toast = inject(ToastService);
    private readonly sanitizer = inject(DomSanitizer);

    loading = signal(true);
    contract = signal<Contract | null>(null);
    downloadLoading = signal(false);

    showPreview = signal(false);
    previewLoading = signal(false);
    safePdfUrl = signal<SafeResourceUrl | null>(null);

    private rawBlobUrl: string | null = null;
    contractUuid: string | null = null;

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.contractUuid = this.route.snapshot.paramMap.get('uuid');
        if (this.contractUuid) {
            this.loadContract();
        } else {
            this.toast.error('UUID du contrat manquant');
            this.router.navigate(['/syndik/contracts']);
        }
    }

    ngOnDestroy(): void {
        this.revokeBlobUrl();
    }

    // ── Chargement ─────────────────────────────────────────────────────────────
    private loadContract(): void {
        if (!this.contractUuid) return;
        this.contractService.getContractByUuid(this.contractUuid).subscribe({
            next: (c) => { this.contract.set(c); this.loading.set(false); },
            error: () => {
                this.toast.error('Erreur lors du chargement du contrat');
                this.router.navigate(['/syndik/contracts']);
            }
        });
    }

    // ── Toggle Détails ↔ Aperçu PDF ────────────────────────────────────────────
    togglePreview(): void {
        if (this.showPreview()) {
            // Retour aux détails — on garde le blob en cache
            this.showPreview.set(false);
            return;
        }

        // Afficher l'aperçu
        this.showPreview.set(true);

        // Si blob déjà chargé → affichage immédiat
        if (this.rawBlobUrl) return;

        this.previewLoading.set(true);
        this.contractService.previewContractPdf(this.contractUuid!).subscribe({
            next: (blob) => {
                this.revokeBlobUrl();
                this.rawBlobUrl = window.URL.createObjectURL(blob);
                this.safePdfUrl.set(
                    this.sanitizer.bypassSecurityTrustResourceUrl(this.rawBlobUrl)
                );
                this.previewLoading.set(false);
            },
            error: () => {
                this.toast.error("Erreur lors de l'aperçu du PDF");
                this.showPreview.set(false);
                this.previewLoading.set(false);
            }
        });
    }

    private revokeBlobUrl(): void {
        if (this.rawBlobUrl) {
            window.URL.revokeObjectURL(this.rawBlobUrl);
            this.rawBlobUrl = null;
            this.safePdfUrl.set(null);
        }
    }

    // ── Téléchargement ─────────────────────────────────────────────────────────
    downloadPdf(): void {
        if (!this.contractUuid || this.downloadLoading()) return;
        this.downloadLoading.set(true);

        this.contractService.downloadContractPdf(this.contractUuid).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Contrat_${this.contract()?.contractNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
                this.downloadLoading.set(false);
                this.toast.success('PDF téléchargé avec succès');
            },
            error: () => {
                this.toast.error('Erreur lors du téléchargement du PDF');
                this.downloadLoading.set(false);
            }
        });
    }

    // ── Navigation ─────────────────────────────────────────────────────────────
    editContract(): void {
        if (!this.contractUuid) return;
        this.router.navigate(['/syndik/contracts/edit', this.contractUuid]);
    }

    goBack(): void {
        this.router.navigate(['/syndik/contracts']);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    formatDate(date: Date | undefined): string {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    getTypeLabel(type: ContractType | undefined): string {
        if (!type) return '';
        const labels: Record<ContractType, string> = {
            [ContractType.RENTAL]: 'Location', [ContractType.OWNERSHIP]: 'Propriété',
            [ContractType.SUBLEASE]: 'Sous-location', [ContractType.COMMERCIAL]: 'Commercial',
            [ContractType.PARKING]: 'Parking', [ContractType.STORAGE]: 'Stockage'
        };
        return labels[type] ?? type;
    }

    getStatusLabel(status: ContractStatus | undefined): string {
        if (!status) return '';
        const labels: Record<ContractStatus, string> = {
            [ContractStatus.DRAFT]: 'Brouillon', [ContractStatus.ACTIVE]: 'Actif',
            [ContractStatus.PENDING]: 'En attente', [ContractStatus.EXPIRED]: 'Expiré',
            [ContractStatus.TERMINATED]: 'Résilié', [ContractStatus.RENEWED]: 'Renouvelé'
        };
        return labels[status] ?? status;
    }

    getStatusClass(status: ContractStatus | undefined): string {
        if (!status) return '';
        const classes: Record<ContractStatus, string> = {
            [ContractStatus.DRAFT]: 'badge-draft', [ContractStatus.ACTIVE]: 'badge-active',
            [ContractStatus.PENDING]: 'badge-pending', [ContractStatus.EXPIRED]: 'badge-expired',
            [ContractStatus.TERMINATED]: 'badge-terminated', [ContractStatus.RENEWED]: 'badge-renewed'
        };
        return classes[status] ?? '';
    }

    getFrequencyLabel(frequency: PaymentFrequency | undefined): string {
        if (!frequency) return '';
        const labels: Record<PaymentFrequency, string> = {
            [PaymentFrequency.MONTHLY]: 'Mensuel', [PaymentFrequency.QUARTERLY]: 'Trimestriel',
            [PaymentFrequency.SEMI_ANNUAL]: 'Semestriel', [PaymentFrequency.ANNUAL]: 'Annuel'
        };
        return labels[frequency] ?? frequency;
    }
}