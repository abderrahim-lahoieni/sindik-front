import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalComponent } from '../modals/modal.component';
import {InputComponent} from '../Input/input.component';
import {ButtonComponent} from '../buttons/button.component';

@Component({
  selector: 'app-edit-appartement-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    ButtonComponent
  ],
  template: `
    <app-modal
      title="Modifier l'appartement"
      [hasFooter]="true"
      (modalClose)="close()"
    >

      <!-- BODY -->
      <form [formGroup]="form" class="space-y-4">

        <app-input
          label="Nom"
          placeholder="Nom de l'appartement"
          formControlName="nom"
        />

        <app-input
          label="Étage"
          type="number"
          formControlName="etage"
        />

        <app-input
          label="Chambres"
          type="number"
          formControlName="chambres"
        />

        <app-input
          label="Propriétaire"
          formControlName="proprietaire"
        />

      </form>

      <!-- FOOTER -->
      <div modal-footer class="flex justify-end gap-3">

        <app-button
          variant="success"
          [disabled]="form.invalid"
          (btnClick)="save()"
        >
          Enregistrer
        </app-button>
      </div>

    </app-modal>
  `
})
export class EditAppartementModalComponent {

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditAppartementModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      nom: [data.nom, Validators.required],
      etage: [data.etage],
      chambres: [data.chambres],
      proprietaire: [data.proprietaire]
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) return;

    console.log('💾 Données sauvegardées', this.form.value);
    this.dialogRef.close(this.form.value);
  }
}
