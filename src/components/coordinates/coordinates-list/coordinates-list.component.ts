import { merge, Subscription } from 'rxjs';
import { PersonWebsocketService } from '../../../service/person-websocket.service';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import {MatSnackBar,MatSnackBarModule} from '@angular/material/snack-bar';

import { Coordinates } from '../../../model/person';

import { CoordinatesService } from '../../../service/coordinates.service';

import { CoordinatesDialogComponent } from '../coordinates-dialog/coordinates-dialog.component';

import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-coordinates-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './coordinates-list.component.html',
  styleUrl: './coordinates-list.component.css'
})
export class CoordinatesListComponent implements OnInit, OnDestroy {

  private websocketSubscription?: Subscription;

  coordinates: Coordinates[] = [];

  loading = false;

  constructor(
    private websocketService: PersonWebsocketService,
    private coordinatesService: CoordinatesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCoordinates();
    this.websocketSubscription = merge(
      this.websocketService.coordinatesChanged$,
      this.websocketService.connected$
    ).subscribe(() => this.loadCoordinates());
    this.websocketService.connect();
  }

  ngOnDestroy(): void {
    this.websocketSubscription?.unsubscribe();
  }

  loadCoordinates(): void {
    this.loading = true;

    this.coordinatesService.getAll()
      .subscribe({
        next: response => {
          this.coordinates = response;
          this.loading = false;
        },

        error: () => {
          this.loading = false;

          this.showError(
            'Не удалось загрузить координаты'
          );
        }
      });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(
      CoordinatesDialogComponent,
      {
        width: '500px',
        maxWidth: '95vw'
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.coordinatesService
        .create(result)
        .subscribe({
          next: () => {
            this.loadCoordinates();
          },

          error: () => {
            this.showError(
              'Не удалось добавить координаты'
            );
          }
        });
    });
  }

  deleteCoordinates(
    coordinates: Coordinates
  ): void {

    if (coordinates.id == null) {
      return;
    }

    const coordinatesId = coordinates.id;

    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        width: '440px',
        maxWidth: '95vw',

        data: {
          title: 'Удалить координаты',
          message:
            `Удалить координаты №${coordinatesId}?`,
          confirmText: 'Удалить',
          cancelText: 'Отмена'
        }
      }
    );

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.coordinatesService
        .delete(coordinatesId)
        .subscribe({
          next: () => {
            this.loadCoordinates();
          },

          error: error => {
            if (error.status === 409) {
              this.showError(
                'Нельзя удалить координаты: они используются в записи о человеке'
              );

              return;
            }
            this.showError(
              'Не удалось удалить координаты'
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