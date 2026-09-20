import { MatTooltipModule } from '@angular/material/tooltip';
import { colorLabel, countryLabel } from '../../../app/ui-labels';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { merge, Subscription } from 'rxjs';

import { Coordinates, Location, Person } from '../../../model/person';

import { PersonService } from '../../../service/person.service';

import { PersonWebsocketService } from '../../../service/person-websocket.service';

import { PersonDialogComponent } from '../person-dialog/person-dialog.component';

import { PersonViewDialogComponent } from '../person-view-dialog/person-view-dialog.component';

import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-person-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSnackBarModule
  ],
  templateUrl: './person-list.component.html',
  styleUrl: './person-list.component.css'
})
export class PersonListComponent implements OnInit, OnDestroy {

  readonly colorLabel = colorLabel;
  readonly countryLabel = countryLabel;

  persons: Person[] = [];

  page = 0;
  size = 10;

  totalElements = 0;
  totalPages = 0;

  sortBy = 'name';
  direction = 'asc';

  nameFilter = '';

  loading = false;

  private websocketSubscription?: Subscription;

  constructor(
    private personService: PersonService,
    private personWebsocketService: PersonWebsocketService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPersons();

    this.websocketSubscription =
      merge(
        this.personWebsocketService.personChanged$,
        this.personWebsocketService.coordinatesChanged$,
        this.personWebsocketService.locationChanged$,
        this.personWebsocketService.connected$
      )
        .subscribe(() => {
          this.loadPersons();
        });

    this.personWebsocketService.connect();
  }

  ngOnDestroy(): void {
    this.websocketSubscription?.unsubscribe();
  }

  loadPersons(): void {
    this.loading = true;

    this.personService.getAll(
      this.page,
      this.size,
      this.sortBy,
      this.direction,
      this.nameFilter
    ).subscribe({
      next: response => {
        this.persons = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;

        this.loading = false;
      },

      error: () => {
        this.loading = false;

        this.showError(
          'Не удалось загрузить людей'
        );
      }
    });
  }

  applyFilter(): void {
    this.page = 0;
    this.loadPersons();
  }

  clearFilter(): void {
    this.nameFilter = '';
    this.page = 0;

    this.loadPersons();
  }

  sortByName(): void {
    this.direction =
      this.direction === 'asc'
        ? 'desc'
        : 'asc';

    this.page = 0;

    this.loadPersons();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;

    this.loadPersons();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(
      PersonDialogComponent,
      {
        width: '720px',
        maxWidth: '95vw',
        data: null
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      const person: Person = {
        name: result.name,

        coordinates: {
          id: result.coordinatesId
        } as Coordinates,

        eyeColor: result.eyeColor,
        hairColor: result.hairColor,

        location: {
          id: result.locationId
        } as Location,

        height: result.height,
        nationality: result.nationality
      };

      this.personService.create(person)
        .subscribe({
          error: () => {
            this.showError(
              'Не удалось добавить человека'
            );
          }
        });
    });
  }

  openEditDialog(person: Person): void {
    const dialogRef = this.dialog.open(
      PersonDialogComponent,
      {
        width: '720px',
        maxWidth: '95vw',
        data: person
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (!result || person.id == null) {
        return;
      }

      const updatedPerson: Person = {
        ...person,

        name: result.name,

        coordinates: {
          id: result.coordinatesId
        } as Coordinates,

        eyeColor: result.eyeColor,
        hairColor: result.hairColor,

        location: {
          id: result.locationId
        } as Location,

        height: result.height,
        nationality: result.nationality
      };

      this.personService
        .update(person.id, updatedPerson)
        .subscribe({
          error: () => {
            this.showError(
              'Не удалось обновить сведения о человеке'
            );
          }
        });
    });
  }

  openViewDialog(person: Person): void {
    const dialogRef = this.dialog.open(
      PersonViewDialogComponent,
      {
        width: '700px',
        maxWidth: '95vw',
        data: person
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'edit') {
        this.openEditDialog(person);
      }
    });
  }

  deletePerson(person: Person): void {
    if (person.id == null) {
      return;
    }

    const personId = person.id;

    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        width: '440px',
        maxWidth: '95vw',

        data: {
          title: 'Удалить человека',
          message:
            `Удалить человека «${person.name}»?`,
          confirmText: 'Удалить',
          cancelText: 'Отмена'
        }
      }
    );

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.personService
        .delete(personId)
        .subscribe({
          next: () => {
            if (
              this.persons.length === 1 &&
              this.page > 0
            ) {
              this.page--;
            }
          },

          error: () => {
            this.showError(
              'Не удалось удалить человека'
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