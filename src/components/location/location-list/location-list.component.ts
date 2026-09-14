import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Location } from '../../../model/person';

import { LocationService } from '../../../service/location.service';

import { LocationDialogComponent } from '../location-dialog/location-dialog.component';

import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './location-list.component.html',
  styleUrl: './location-list.component.css'
})
export class LocationListComponent implements OnInit {

  locations: Location[] = [];

  loading = false;

  constructor(
    private locationService: LocationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading = true;

    this.locationService.getAll()
      .subscribe({
        next: response => {
          this.locations = response;
          this.loading = false;
        },

        error: () => {
          this.loading = false;

          this.showError(
            'Failed to load locations'
          );
        }
      });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(
      LocationDialogComponent,
      {
        width: '600px',
        maxWidth: '95vw'
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.locationService
        .create(result)
        .subscribe({
          next: () => {
            this.loadLocations();
          },

          error: () => {
            this.showError(
              'Failed to create location'
            );
          }
        });
    });
  }

  deleteLocation(location: Location): void {
    if (location.id == null) {
      return;
    }

    const locationId = location.id;

    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        width: '440px',
        maxWidth: '95vw',

        data: {
          title: 'Delete location',
          message:
            `Are you sure you want to delete location #${locationId}?`,
          confirmText: 'Delete',
          cancelText: 'Cancel'
        }
      }
    );

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.locationService
        .delete(locationId)
        .subscribe({
          next: () => {
            this.loadLocations();
          },

          error: error => {
            if (error.status === 409) {
              this.showError(
                'Cannot delete location because it is used by a person'
              );

              return;
            }

            this.showError(
              'Failed to delete location'
            );
          }
        });
    });
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