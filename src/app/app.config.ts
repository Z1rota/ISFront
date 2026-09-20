import {ApplicationConfig, LOCALE_ID, provideZoneChangeDetection} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { russianPaginatorIntl } from './russian-paginator-intl';

import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

registerLocaleData(localeRu);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    { provide: MatPaginatorIntl, useFactory: russianPaginatorIntl },
    provideRouter(routes),
    provideHttpClient(),

    provideZoneChangeDetection()
  ]
};
