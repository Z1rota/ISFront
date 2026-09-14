import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { Coordinates } from '../../../model/person';

@Component({
  selector: 'app-coordinates-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,

    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './coordinates-dialog.component.html',
  styleUrl: './coordinates-dialog.component.css'
})
export class CoordinatesDialogComponent {

  form;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<
      CoordinatesDialogComponent,
      Coordinates
    >
  ) {
    this.form = this.fb.group({
      x: [
        null as number | null,
        Validators.required
      ],

      y: [
        null as number | null,
        Validators.required
      ]
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const coordinates: Coordinates = {
      x: value.x!,
      y: value.y!
    };

    this.dialogRef.close(coordinates);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}