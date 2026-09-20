import { colorLabel, countryLabel } from '../../../app/ui-labels';
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';

import { Person } from '../../../model/person';

@Component({
  selector: 'app-person-view-dialog',
  standalone: true,

  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],

  templateUrl: './person-view-dialog.component.html',
  styleUrl: './person-view-dialog.component.css'
})
export class PersonViewDialogComponent {

  readonly colorLabel = colorLabel;
  readonly countryLabel = countryLabel;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public person: Person,

    private dialogRef:
      MatDialogRef<PersonViewDialogComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  edit(): void {
    this.dialogRef.close('edit');
  }
}