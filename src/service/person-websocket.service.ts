import { Injectable, NgZone } from '@angular/core';

import { Client, IMessage } from '@stomp/stompjs';

import { Subject } from 'rxjs';

export interface PersonChangeEvent {
  type: 'CREATED' | 'UPDATED' | 'DELETED';
  personId: number;
}

@Injectable({
  providedIn: 'root'
})
export class PersonWebsocketService {

  private client: Client;

  private personChangedSubject =
    new Subject<PersonChangeEvent>();

  personChanged$ =
    this.personChangedSubject.asObservable();

  constructor(
    private ngZone: NgZone
  ) {

    const protocol =
      window.location.protocol === 'https:'
        ? 'wss'
        : 'ws';

    this.client = new Client({
      brokerURL:
        `${protocol}://${window.location.host}/ws`,

      reconnectDelay: 5000,

      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000
    });

    this.client.onConnect = () => {
      this.client.subscribe(
        '/topic/persons',
        (message: IMessage) => {

          const event: PersonChangeEvent =
            JSON.parse(message.body);

          this.ngZone.run(() => {
            this.personChangedSubject.next(event);
          });
        }
      );
    };
  }

  connect(): void {
    if (!this.client.active) {
      this.client.activate();
    }
  }
}