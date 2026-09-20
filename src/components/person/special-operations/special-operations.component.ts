import { colorLabel, countryLabel } from '../../../app/ui-labels';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Color, Country, Person } from '../../../model/person';

import { NationalityCount, PersonService } from '../../../service/person.service';

import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-special-operations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './special-operations.component.html',
  styleUrl: './special-operations.component.css'
})
export class SpecialOperationsComponent {

  readonly colorLabel = colorLabel;
  readonly countryLabel = countryLabel;

  countries = Object.values(Country);
  colors = Object.values(Color);

  selectedNationality: Country | null = null;
  selectedHairColor: Color | null = null;
  selectedEyeColor: Color | null = null;

  minHeightPerson: Person | null = null;

  nationalityGroups: NationalityCount[] = [];

  hairColorPercentage: number | null = null;
  eyeColorCount: number | null = null;

  constructor(
    private personService: PersonService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  deleteByNationality(): void {
    if (!this.selectedNationality) {
      return;
    }

    const nationality = this.selectedNationality;

    const dialogRef = this.dialog.open(
      ConfirmDialogComponent,
      {
        width: '460px',
        maxWidth: '95vw',

        data: {
          title: 'Удалить человека',
          message:
            `Удалить одного человека с гражданством «${this.countryLabel(nationality)}»?`,
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
        .deleteOneByNationality(nationality)
        .subscribe({
          next: () => {
            this.refreshDependentResults();
          },

          error: error => {
            if (error.status === 404) {
              this.showError(
                `Человек с гражданством «${this.countryLabel(nationality)}» не найден`
              );

              return;
            }

            this.showError(
              'Не удалось удалить человека'
            );
          }
        });
    });
  }

  getMinHeightPerson(): void {
    this.personService
      .getMinHeightPerson()
      .subscribe({
        next: person => {
          this.minHeightPerson = person;
        },

        error: error => {
          this.minHeightPerson = null;

          if (error.status === 404) {
            this.showError(
              'Люди не найдены'
            );

            return;
          }

          this.showError(
            'Не удалось найти человека с минимальным ростом'
          );
        }
      });
  }

  groupByNationality(): void {
    this.personService
      .groupByNationality()
      .subscribe({
        next: result => {
          this.nationalityGroups = result;
        },

        error: () => {
          this.nationalityGroups = [];

          this.showError(
            'Не удалось сгруппировать людей по гражданству'
          );
        }
      });
  }

  getHairColorPercentage(): void {
    if (!this.selectedHairColor) {
      return;
    }

    this.personService
      .getHairColorPercentage(
        this.selectedHairColor
      )
      .subscribe({
        next: percentage => {
          this.hairColorPercentage = percentage;
        },

        error: () => {
          this.hairColorPercentage = null;

          this.showError(
            'Не удалось рассчитать долю людей по цвету волос'
          );
        }
      });
  }

  getEyeColorCount(): void {
    if (!this.selectedEyeColor) {
      return;
    }

    this.personService
      .countByEyeColor(
        this.selectedEyeColor
      )
      .subscribe({
        next: count => {
          this.eyeColorCount = count;
        },

        error: () => {
          this.eyeColorCount = null;

          this.showError(
            'Не удалось подсчитать людей по цвету глаз'
          );
        }
      });
  }

  private refreshDependentResults(): void {
    if (this.minHeightPerson) {
      this.getMinHeightPerson();
    }

    if (this.nationalityGroups.length > 0) {
      this.groupByNationality();
    }

    if (
      this.hairColorPercentage !== null &&
      this.selectedHairColor
    ) {
      this.getHairColorPercentage();
    }

    if (
      this.eyeColorCount !== null &&
      this.selectedEyeColor
    ) {
      this.getEyeColorCount();
    }
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