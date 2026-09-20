import { merge, Subscription } from 'rxjs';
import { PersonWebsocketService } from '../../../service/person-websocket.service';
import { Component, OnDestroy, OnInit } from '@angular/core';

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
export class LocationListComponent implements OnInit, OnDestroy {

  private websocketSubscription?: Subscription;

  locations: Location[] = [];

  loading = false;

  constructor(
    private websocketService: PersonWebsocketService,
    private locationService: LocationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadLocations();
    this.websocketSubscription = merge(
      this.websocketService.locationChanged$,
      this.websocketService.connected$
    ).subscribe(() => this.loadLocations());
    this.websocketService.connect();
  }

  ngOnDestroy(): void {
    this.websocketSubscription?.unsubscribe();
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
            'Не удалось загрузить местоположения'
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
              'Не удалось добавить местоположение'
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
          title: 'Удалить местоположение',
          message:
            `Удалить местоположение №${locationId}?`,
          confirmText: 'Удалить',
          cancelText: 'Отмена'
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
                'Нельзя удалить местоположение: оно используется в записи о человеке'
              );

              return;
            }

            this.showError(
              'Не удалось удалить местоположение'
            );
          }
        });
    });
  }

  private showError(message: string): void {
    this.snackBar.open(
      message,
      'Закрыть',
      {
        duration: 4000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      }
    );
  }
}