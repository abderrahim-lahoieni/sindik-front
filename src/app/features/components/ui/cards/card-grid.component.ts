// src/app/components/ui/cards/card-grid.component.ts

import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

export interface CardField {
  key: string;
  label: string;
  icon?: string;
  format?: (value: any, row?: any) => string;
  type?: 'text' | 'badge' | 'date' | 'image' | 'custom';
  badgeClass?: (value: any) => string;
}

export interface CardAction {
  icon: string | ((row: any) => string);
  label: string | ((row: any) => string);
  color?: 'primary' | 'success' | 'danger' | 'warning';
  hidden?: (row: any) => boolean;
  callback: (row: any) => void;
}

export interface CardConfig {
  titleKey: string;
  subtitleKey?: string;
  imageKey?: string;
  fields: CardField[];
  actions?: CardAction[];
}

@Component({
  selector: 'app-card-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  template: `
    <div class="card-grid-container">
      
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && data.length === 0" class="empty-state">
        <mat-icon class="empty-icon">inbox</mat-icon>
        <p class="empty-message">{{ emptyMessage }}</p>
      </div>

      <!-- Cards Grid -->
      <div *ngIf="!loading && data.length > 0" class="cards-grid">
        <div 
          *ngFor="let item of data" 
          class="card"
          [class.clickable]="clickable"
          (click)="onCardClick(item)">
          
          <!-- Card Header -->
          <div class="card-header">
            <div class="card-header-content">
              <!-- Image/Avatar -->
              <div *ngIf="config.imageKey" class="card-avatar">
                <img 
                  [src]="getFieldValue(item, config.imageKey)" 
                  [alt]="getFieldValue(item, config.titleKey)"
                  (error)="$event.target.src = 'assets/images/default-avatar.png'"
                />
              </div>

              <!-- Title & Subtitle -->
              <div class="card-title-section">
                <h3 class="card-title">
                  {{ getFieldValue(item, config.titleKey) }}
                </h3>
                <p *ngIf="config.subtitleKey" class="card-subtitle">
                  {{ getFieldValue(item, config.subtitleKey) }}
                </p>
              </div>
            </div>

            <!-- Actions Menu -->
            <button 
              *ngIf="config.actions && config.actions.length > 0"
              mat-icon-button
              [matMenuTriggerFor]="cardMenu"
              class="card-menu-button"
              (click)="$event.stopPropagation()">
              <mat-icon>more_vert</mat-icon>
            </button>

            <mat-menu #cardMenu="matMenu">
              <ng-container *ngFor="let action of config.actions">
                <button
                  mat-menu-item
                  *ngIf="!action.hidden || !action.hidden(item)"
                  (click)="executeAction(action, item)"
                  [class]="'action-' + (action.color || 'default')">
                  <mat-icon>
                    {{ typeof action.icon === 'function' ? action.icon(item) : action.icon }}
                  </mat-icon>
                  <span>
                    {{ typeof action.label === 'function' ? action.label(item) : action.label }}
                  </span>
                </button>
              </ng-container>
            </mat-menu>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <div *ngFor="let field of config.fields" class="card-field">
              <div class="field-icon-label">
                <mat-icon *ngIf="field.icon" class="field-icon">{{ field.icon }}</mat-icon>
                <span class="field-label">{{ field.label }}</span>
              </div>
              
              <div class="field-value">
                <ng-container [ngSwitch]="field.type || 'text'">
                  
                  <!-- Badge -->
                  <span 
                    *ngSwitchCase="'badge'" 
                    class="badge"
                    [ngClass]="field.badgeClass ? field.badgeClass(getFieldValue(item, field.key)) : ''">
                    {{ field.format ? field.format(getFieldValue(item, field.key), item) : getFieldValue(item, field.key) }}
                  </span>

                  <!-- Date -->
                  <span *ngSwitchCase="'date'">
                    {{ getFieldValue(item, field.key) ? (getFieldValue(item, field.key) | date: 'dd/MM/yyyy') : '-' }}
                  </span>

                  <!-- Custom HTML -->
                  <span 
                    *ngSwitchCase="'custom'" 
                    [innerHTML]="field.format ? field.format(getFieldValue(item, field.key), item) : getFieldValue(item, field.key)">
                  </span>

                  <!-- Text (default) -->
                  <span *ngSwitchDefault>
                    {{ field.format ? field.format(getFieldValue(item, field.key), item) : (getFieldValue(item, field.key) || '-') }}
                  </span>
                </ng-container>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./card-grid.component.scss']
})
export class CardGridComponent {
  @Input() config!: CardConfig;
  @Input() data: any[] = [];
  @Input() loading: boolean = false;
  @Input() clickable: boolean = false;
  @Input() emptyMessage: string = 'Aucune donnée disponible';

  @Output() cardClick = new EventEmitter<any>();

  getFieldValue(item: any, key: string): any {
    return key.split('.').reduce((obj, prop) => obj?.[prop], item);
  }

  onCardClick(item: any): void {
    if (this.clickable) {
      this.cardClick.emit(item);
    }
  }

  executeAction(action: CardAction, item: any): void {
    action.callback(item);
  }
}