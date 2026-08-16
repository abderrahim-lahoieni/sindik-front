import { Component } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from './table.component';
import {ModalService} from '../modals/modal.service';
import {EditAppartementModalComponent} from './edit-appartement-modal.component';
import ToastService from '../toast/toast.service';

@Component({
  selector: 'app-table-test',
  standalone: true,
  imports: [TableComponent],
  templateUrl: './test.html',
})
export class TableTestComponent {
  constructor(
    private readonly modal: ModalService,
    private readonly toast: ToastService

  ) {}


  loading = false;

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, width: '60px' },
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'etage', label: 'Étage', sortable: true, align: 'center' },
    { key: 'chambres', label: 'Chambres', align: 'center' },
    { key: 'proprietaire', label: 'Propriétaire' },
  ];

  data = [
    { id: 1, nom: 'Appartement A', etage: 2, chambres: 3, proprietaire: 'Ali' },
    { id: 2, nom: 'Appartement B', etage: 5, chambres: 4, proprietaire: 'Sara' },
    { id: 3, nom: 'Appartement C', etage: 1, chambres: 2, proprietaire: 'Omar' },
    { id: 4, nom: 'Appartement D', etage: 3, chambres: 5, proprietaire: 'Hassan' },
  ];

  actions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'Voir',
      callback: (row) => {
        this.modal.alert(row.nom).subscribe((confirmed) => {
          if (confirmed) {
            console.log('✅ Voir confirmée:', row);
            this.toast.info('Voir confirmée');
          } else {
            console.log('❌ Suppression annulée');
          }
        });
      },
    },
    {
      icon: 'edit',
      label: 'Modifier',
      callback: (row) => {
        this.modal.open(EditAppartementModalComponent, {
          width: '600px',
          data: row
        }).afterClosed().subscribe(result => {
          if (result) {
            console.log('✅ Modification validée');
            this.toast.success('Modification validée',1000);
          } else {
            console.log('❌ Modification annulée');
          }
        });
      }
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      callback: (row) => {
        this.modal.confirmDelete(row.nom).subscribe((confirmed) => {
          if (confirmed) {
            console.log('✅ Suppression confirmée:', row);
            this.toast.delete('Suppression confirmée');
          } else {
            console.log('❌ Suppression annulée');
            this.toast.warning('Suppression annulée',1000);
          }

        });
      },
    },
    {
      icon: 'help',
      label: 'Tester Confirm',
      callback: () => {
        this.modal.confirm({
          title: 'Test Confirm Dialog',
          message: 'Est-ce que ce modal fonctionne correctement ?',
          type: 'info',
          confirmText: 'Oui',
          cancelText: 'Non'
        }).subscribe(result => {
          this.toast.success('Suppression annulée');
        });
      }
    }

  ];

  onRowClick(row: any) {
    this.modal.confirm({
      title: 'Confirmation',
      message: `Vous avez cliqué sur ${row.nom}. Continuer ?`,
      type: 'info',
      confirmText: 'OK',
      cancelText: 'Annuler'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.toast.info(`Action confirmée pour ${row.nom}`);
      }
    });
  }

  onSelectionChange(rows: any[]) {
    console.log('Selected rows:', rows);
  }

  onSortChange(sort: any) {
    console.log('Sort:', sort);
  }

  onPageChange(event: any) {
    console.log('Page:', event);
  }

}
