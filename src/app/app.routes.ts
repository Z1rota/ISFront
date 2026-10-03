import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './auth.guards';

import { PersonListComponent } from '../components/person/person-list/person-list.component';
import { CoordinatesListComponent } from '../components/coordinates/coordinates-list/coordinates-list.component';
import { LocationListComponent } from '../components/location/location-list/location-list.component';
import { SpecialOperationsComponent } from '../components/person/special-operations/special-operations.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../components/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('../components/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    redirectTo: 'persons',
    pathMatch: 'full',
  },
  {
    path: 'persons',
    canActivate: [authGuard],
    component: PersonListComponent,
  },
  {
    path: 'coordinates',
    canActivate: [authGuard],
    component: CoordinatesListComponent,
  },
  {
    path: 'locations',
    canActivate: [authGuard],
    component: LocationListComponent,
  },
  {
    path: 'special',
    canActivate: [authGuard],
    component: SpecialOperationsComponent,
  },
  {
    path: 'imports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../components/imports/import-page.component').then((m) => m.ImportPageComponent),
    children: [
      {
        path: '',
        canMatch: [adminGuard],
        data: { allUsers: true },
        loadComponent: () =>
          import('../components/imports/import-history.component').then(
            (m) => m.ImportHistoryComponent,
          ),
      },
      { path: '', children: [] },
    ],
  },
  {
    path: '**',
    redirectTo: 'persons',
  },
];
