import { Component, Inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Color, Coordinates, Country, Location, Person } from '../../../model/person';
import { CoordinatesService } from '../../../service/coordinates.service';
import { LocationService } from '../../../service/location.service';
import { CoordinatesDialogComponent } from '../../coordinates/coordinates-dialog/coordinates-dialog.component';
import { LocationDialogComponent } from '../../location/location-dialog/location-dialog.component';

export interface PersonDialogResult {
  name: string;
  coordinatesId: number;
  eyeColor: Color | null;
  hairColor: Color;
  locationId: number;
  height: number;
  nationality: Country | null;
}

@Component({
  selector: 'app-person-dialog',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],

  templateUrl: './person-dialog.component.html',
  styleUrl: './person-dialog.component.css'
})
export class PersonDialogComponent implements OnInit {

  form: FormGroup;

  coordinates: Coordinates[] = [];
  locations: Location[] = [];

  colors = Object.values(Color);
  countries = Object.values(Country);

  loadingReferences = true;
  referencesLoadFailed = false;

  constructor(
    private fb: FormBuilder,

    private coordinatesService: CoordinatesService,
    private locationService: LocationService,

    private dialog: MatDialog,
    private snackBar: MatSnackBar,

    private dialogRef: MatDialogRef<
      PersonDialogComponent,
      PersonDialogResult
    >,

    @Inject(MAT_DIALOG_DATA)
    public data: Person | null
  ) {

    this.form = this.fb.group({

      name: [
        data?.name ?? '',
        [
          Validators.required,
          notBlankValidator
        ]
      ],

      coordinatesId: [
        data?.coordinates?.id ?? null,
        Validators.required
      ],

      eyeColor: [
        data?.eyeColor ?? null
      ],

      hairColor: [
        data?.hairColor ?? null,
        Validators.required
      ],

      locationId: [
        data?.location?.id ?? null,
        Validators.required
      ],

      height: [
        data?.height ?? null,
        [
          Validators.required,
          positiveValidator
        ]
      ],

      nationality: [
        data?.nationality ?? null
      ]
    });
  }

  ngOnInit(): void {
    this.loadReferences();
  }

  loadReferences(): void {
    this.loadingReferences = true;
    this.referencesLoadFailed = false;

    forkJoin({
      coordinates:
        this.coordinatesService.getAll(),

      locations:
        this.locationService.getAll()
    })
      .subscribe({
        next: result => {
          this.coordinates =
            result.coordinates;

          this.locations =
            result.locations;

          this.loadingReferences = false;
        },

        error: () => {
          this.referencesLoadFailed = true;
          this.loadingReferences = false;
        }
      });
  }

  openCreateCoordinatesDialog(): void {
    const dialogRef = this.dialog.open(
      CoordinatesDialogComponent,
      {
        width: '500px',
        maxWidth: '95vw'
      }
    );

    dialogRef.afterClosed().subscribe(coordinates => {
      if (!coordinates) {
        return;
      }

      this.coordinatesService
        .create(coordinates)
        .subscribe({
          next: createdCoordinates => {
            this.coordinates.push(
              createdCoordinates
            );

            this.form.patchValue({
              coordinatesId:
                createdCoordinates.id
            });
          },

          error: () => {
            this.showError(
              'Failed to create coordinates'
            );
          }
        });
    });
  }

  openCreateLocationDialog(): void {
    const dialogRef = this.dialog.open(
      LocationDialogComponent,
      {
        width: '600px',
        maxWidth: '95vw'
      }
    );

    dialogRef.afterClosed().subscribe(location => {
      if (!location) {
        return;
      }

      this.locationService
        .create(location)
        .subscribe({
          next: createdLocation => {
            this.locations.push(
              createdLocation
            );

            this.form.patchValue({
              locationId:
                createdLocation.id
            });
          },

          error: () => {
            this.showError(
              'Failed to create location'
            );
          }
        });
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const result: PersonDialogResult = {
      name: value.name.trim(),
      coordinatesId: value.coordinatesId,
      eyeColor: value.eyeColor,
      hairColor: value.hairColor,
      locationId: value.locationId,
      height: value.height,
      nationality: value.nationality
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  get isEdit(): boolean {
    return this.data != null;
  }

  private showError(message: string): void {
    this.snackBar.open(
      message,
      'Close',
      {
        duration: 4000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      }
    );
  }
}

function notBlankValidator(
  control: AbstractControl
): ValidationErrors | null {

  const value = control.value;

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  if (
    typeof value === 'string' &&
    value.trim().length === 0
  ) {
    return {
      blank: true
    };
  }

  return null;
}

function positiveValidator(
  control: AbstractControl
): ValidationErrors | null {

  const value = control.value;

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  return Number(value) > 0
    ? null
    : {
        positive: true
      };
}