import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row?: any) => string;
}

export interface TableAction {
  icon: string | ((row: any) => string);
  label: string | ((row: any) => string);
  color?: 'primary' | 'success' | 'danger' | 'warning';

  hidden?: (row: any) => boolean;

  callback: (row: any) => void;
}


@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableAction[] = [];
  @Input() showActions: boolean = false;
  @Input() loading: boolean = false;
  @Input() selectable: boolean = false;
  @Input() striped: boolean = true;
  @Input() hoverable: boolean = true;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  @Input() showPagination: boolean = true;
  @Input() emptyMessage: string = 'Aucune donnée disponible';

  @Output() rowClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  selectedRows = signal<Set<any>>(new Set());
  searchQuery = signal<string>('');
  currentPage = signal<number>(0);
  sortedData = signal<any[]>([]);

  ngOnInit(): void {
    this.sortedData.set([...this.data]);
  }

  ngOnChanges(): void {
    this.sortedData.set([...this.data]);
    this.applyFilter();
  }

  get displayedColumns(): string[] {
    const cols = this.columns.map(col => col.key);
    if (this.selectable) cols.unshift('select');
    if (this.actions.length > 0) cols.push('actions');
    return cols;
  }

  get filteredData(): any[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.sortedData();

    return this.sortedData().filter(row => {
      return this.columns.some(col => {
        const value = this.getCellValue(row, col.key);
        return value?.toString().toLowerCase().includes(query);
      });
    });
  }

  get paginatedData(): any[] {
    if (!this.showPagination) return this.filteredData;

    const startIndex = this.currentPage() * this.pageSize;
    return this.filteredData.slice(startIndex, startIndex + this.pageSize);
  }

  get allSelected(): boolean {
    return this.paginatedData.length > 0 &&
      this.paginatedData.every(row => this.selectedRows().has(row));
  }

  get someSelected(): boolean {
    return this.paginatedData.some(row => this.selectedRows().has(row)) &&
      !this.allSelected;
  }

  // Selection
  toggleAllRows(): void {
    const newSelection = new Set(this.selectedRows());

    if (this.allSelected) {
      this.paginatedData.forEach(row => newSelection.delete(row));
    } else {
      this.paginatedData.forEach(row => newSelection.add(row));
    }

    this.selectedRows.set(newSelection);
    this.selectionChange.emit(Array.from(newSelection));
  }

  toggleRow(row: any): void {
    const newSelection = new Set(this.selectedRows());

    if (newSelection.has(row)) {
      newSelection.delete(row);
    } else {
      newSelection.add(row);
    }

    this.selectedRows.set(newSelection);
    this.selectionChange.emit(Array.from(newSelection));
  }

  isRowSelected(row: any): boolean {
    return this.selectedRows().has(row);
  }

  // Sorting
  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);

    if (!sort.active || sort.direction === '') {
      this.sortedData.set([...this.data]);
      return;
    }

    const sorted = [...this.data].sort((a, b) => {
      const aValue = this.getCellValue(a, sort.active);
      const bValue = this.getCellValue(b, sort.active);

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    this.sortedData.set(sorted);
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize = event.pageSize;
    this.pageChange.emit(event);
  }


  // Search
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(0);
    this.applyFilter();
  }

  applyFilter(): void {
    // Filter is computed in filteredData getter
  }

  // Helpers
  getCellValue(row: any, key: string): any {
    return key.split('.').reduce((obj, prop) => obj?.[prop], row);
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  executeAction(action: TableAction, row: any): void {
    action.callback(row);
  }

  getColumnAlignment(column: TableColumn): string {
    return column.align || 'left';
  }
}
