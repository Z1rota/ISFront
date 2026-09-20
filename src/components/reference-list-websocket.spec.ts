import { Subject, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CoordinatesListComponent } from './coordinates/coordinates-list/coordinates-list.component';
import { LocationListComponent } from './location/location-list/location-list.component';
import { PersonListComponent } from './person/person-list/person-list.component';

function setup() {
  const websocket = {
    coordinatesChanged$: new Subject<void>(),
    locationChanged$: new Subject<void>(),
    personChanged$: new Subject<void>(),
    connected$: new Subject<void>(),
    connect: vi.fn(),
    disconnect: vi.fn()
  };
  const api = { getAll: vi.fn(() => of([])) };
  const coordinates = new CoordinatesListComponent(websocket as never, api as never, {} as never, {} as never);
  const locations = new LocationListComponent(websocket as never, api as never, {} as never, {} as never);
  return { websocket, api, coordinates, locations };
}

describe('reference table websocket lifecycle', () => {
  for (const kind of ['coordinates', 'locations'] as const) {
    it(kind + ' connects when opened directly, refreshes on changes and reconnect, and cleans up', () => {
      const { websocket, api, coordinates, locations } = setup();
      const component = kind === 'coordinates' ? coordinates : locations;
      const changes = kind === 'coordinates' ? websocket.coordinatesChanged$ : websocket.locationChanged$;
      component.ngOnInit();
      expect(websocket.connect).toHaveBeenCalledOnce();
      expect(api.getAll).toHaveBeenCalledTimes(1);
      changes.next();
      expect(api.getAll).toHaveBeenCalledTimes(2);
      websocket.connected$.next();
      expect(api.getAll).toHaveBeenCalledTimes(3);
      component.ngOnDestroy();
      changes.next();
      websocket.connected$.next();
      expect(api.getAll).toHaveBeenCalledTimes(3);
      expect(websocket.disconnect).not.toHaveBeenCalled();
    });
  }

  it('keeps reference updates working after leaving the persons tab', () => {
    const { websocket, api, coordinates, locations } = setup();
    const personsApi = { getAll: vi.fn(() => of({ content: [], totalElements: 0, totalPages: 0 })) };
    const persons = new PersonListComponent(personsApi as never, websocket as never, {} as never, {} as never);
    persons.ngOnInit();
    persons.ngOnDestroy();
    coordinates.ngOnInit();
    websocket.coordinatesChanged$.next();
    expect(api.getAll).toHaveBeenCalledTimes(2);
    coordinates.ngOnDestroy();
    locations.ngOnInit();
    websocket.locationChanged$.next();
    expect(api.getAll).toHaveBeenCalledTimes(4);
    expect(personsApi.getAll).toHaveBeenCalledTimes(1);
    expect(websocket.disconnect).not.toHaveBeenCalled();
    locations.ngOnDestroy();
  });
});
