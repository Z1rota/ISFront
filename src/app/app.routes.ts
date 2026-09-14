import { Routes } from '@angular/router';

import { PersonListComponent } from '../components/person/person-list/person-list.component';
import { CoordinatesListComponent } from '../components/coordinates/coordinates-list/coordinates-list.component';
import { LocationListComponent } from '../components/location/location-list/location-list.component';
import { SpecialOperationsComponent } from '../components/person/special-operations/special-operations.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'persons',
    pathMatch: 'full'
  },
  {
    path: 'persons',
    component: PersonListComponent
  },
  {
    path: 'coordinates',
    component: CoordinatesListComponent
  },
  {
    path: 'locations',
    component: LocationListComponent
  },
  {
    path: 'special',
    component: SpecialOperationsComponent
  },
  {
    path: '**',
    redirectTo: 'persons'
  }
];