import { Injectable, NgZone } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';

export interface PersonChangeEvent {
  type: 'CREATED' | 'UPDATED' | 'DELETED';
  personId: number;
}

export interface CoordinatesChangeEvent {
  type: PersonChangeEvent['type'];
  coordinatesId: number;
}

export interface LocationChangeEvent {
  type: PersonChangeEvent['type'];
  locationId: number;
}

@Injectable({ providedIn: 'root' })
export class PersonWebsocketService {
  private client: Client;
  private personChangedSubject = new Subject<PersonChangeEvent>();
  private coordinatesChangedSubject = new Subject<CoordinatesChangeEvent>();
  private locationChangedSubject = new Subject<LocationChangeEvent>();
  private connectedSubject = new Subject<void>();

  readonly personChanged$ = this.personChangedSubject.asObservable();
  readonly coordinatesChanged$ = this.coordinatesChangedSubject.asObservable();
  readonly locationChanged$ = this.locationChangedSubject.asObservable();
  readonly connected$ = this.connectedSubject.asObservable();

  constructor(private ngZone: NgZone) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.client = new Client({
      brokerURL: protocol + '://' + window.location.host + '/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000
    });

    this.client.onConnect = () => {
      this.subscribeToChanges('/topic/person', 'personId', this.personChangedSubject);
      this.subscribeToChanges('/topic/coordinates', 'coordinatesId', this.coordinatesChangedSubject);
      this.subscribeToChanges('/topic/locations', 'locationId', this.locationChangedSubject);
      this.ngZone.run(() => this.connectedSubject.next());
    };
  }

  private subscribeToChanges<T extends { type: PersonChangeEvent['type'] }>(
    destination: string,
    idKey: keyof T,
    subject: Subject<T>
  ): void {
    this.client.subscribe(destination, (message: IMessage) => {
      let event;
      try {
        event = JSON.parse(message.body);
      } catch {
        return;
      }
      if (
        event === null || typeof event !== 'object' ||
        !['CREATED', 'UPDATED', 'DELETED'].includes(event.type) ||
        !Number.isInteger(event[idKey])
      ) {
        return;
      }
      this.ngZone.run(() => subject.next(event as T));
    });
  }

  connect(): void {
    if (!this.client.active) {
      this.client.activate();
    }
  }
}
