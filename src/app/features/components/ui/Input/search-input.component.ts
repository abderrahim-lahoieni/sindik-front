// src/app/components/ui/inputs/search-input.component.ts

import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        [placeholder]="placeholder()"
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        (keyup.enter)="search.emit(value())"
        class="search-input"
      />
      @if (value()) {
        <button class="clear-btn" (click)="clear()">✕</button>
      }
    </div>
  `,
  styles: [`
    .search-container {
      position: relative;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.95rem;
      transition: all 0.2s;
      background: white;

      &:focus {
        outline: none;
        border-color: #ffc312;
        box-shadow: 0 0 0 3px rgba(255,195,18,0.1);
      }

      &::placeholder {
        color: #94a3b8;
      }
    }

    .clear-btn {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: #e2e8f0;
      border: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #cbd5e1;
        color: #0f172a;
      }
    }
  `]
})
export class SearchInputComponent {
  placeholder = input('Rechercher...');
  debounceTime = input(300);
  
  value = model('');
  search = output<string>();

  private searchTimeout: any;

  onValueChange(value: string): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.search.emit(value);
    }, this.debounceTime());
  }

  

  clear(): void {
    this.value.set('');
    this.search.emit('');
  }
}