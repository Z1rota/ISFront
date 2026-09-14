import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { Location } from '../../../model/person';

@Component({
  selector: 'app-location-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,

    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './location-dialog.component.html',
  styleUrl: './location-dialog.component.css'
})
export class LocationDialogComponent {

  form;

  constructor(
    private fb: FormBuilder,

    private dialogRef: MatDialogRef<
      LocationDialogComponent,
      Location
    >
  ) {
    this.form = this.fb.group({

      x: [
        null as number | null,
        Validators.required
      ],

      y: [
        0,
        Validators.required
      ],

      z: [
        0,
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

    const location: Location = {
      x: value.x!,
      y: value.y!,
      z: value.z!
    };

    this.dialogRef.close(location);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}