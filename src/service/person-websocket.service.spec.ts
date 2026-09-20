import { TestBed } from '@angular/core/testing';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PersonWebsocketService } from './person-websocket.service';

describe('table change notifications', () => {
  let service: PersonWebsocketService;
  let client: Client;
  let callbacks: Map<string, (message: IMessage) => void>;

  beforeEach(() => {
    callbacks = new Map();
    vi.spyOn(Client.prototype, 'activate').mockImplementation(function (this: Client) {
      client = this;
    });
    vi.spyOn(Client.prototype, 'subscribe').mockImplementation((topic, callback) => {
      callbacks.set(topic, callback);
      return { id: topic, unsubscribe: () => {} } as StompSubscription;
    });
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonWebsocketService);
    service.connect();
  });

  afterEach(() => vi.restoreAllMocks());

  it('routes each backend topic to its own observable', () => {
    const persons = vi.fn();
    const coordinates = vi.fn();
    const locations = vi.fn();
    service.personChanged$.subscribe(persons);
    service.coordinatesChanged$.subscribe(coordinates);
    service.locationChanged$.subscribe(locations);
    client.onConnect({} as never);
    const cases = [
      ['/topic/person', { type: 'UPDATED', personId: 1 }, persons],
      ['/topic/coordinates', { type: 'CREATED', coordinatesId: 2 }, coordinates],
      ['/topic/locations', { type: 'DELETED', locationId: 3 }, locations]
    ] as const;
    for (const [topic, event, listener] of cases) {
      callbacks.get(topic)!({ body: JSON.stringify(event) } as IMessage);
      expect(listener).toHaveBeenCalledExactlyOnceWith(event);
    }
    expect(persons).toHaveBeenCalledTimes(1);
    expect(coordinates).toHaveBeenCalledTimes(1);
    expect(locations).toHaveBeenCalledTimes(1);
  });

  it('ignores malformed messages and still delivers later valid changes', () => {
    const listener = vi.fn();
    service.coordinatesChanged$.subscribe(listener);
    client.onConnect({} as never);
    for (const body of ['invalid', 'null', '{}', '{"type":"UNKNOWN","coordinatesId":1}', '{"type":"CREATED","coordinatesId":"1"}']) {
      expect(() => callbacks.get('/topic/coordinates')!({ body } as IMessage)).not.toThrow();
    }
    expect(listener).not.toHaveBeenCalled();
    callbacks.get('/topic/coordinates')!({ body: '{"type":"CREATED","coordinatesId":1}' } as IMessage);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('restores subscriptions and requests refresh on reconnect', () => {
    const refresh = vi.fn();
    service.connected$.subscribe(refresh);
    client.onConnect({} as never);
    callbacks.clear();
    client.onConnect({} as never);
    expect(callbacks.size).toBe(3);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('does not activate a second connection when already active', () => {
    vi.spyOn(client, 'active', 'get').mockReturnValue(true);
    service.connect();
    expect(client.activate).toHaveBeenCalledTimes(1);
  });
});
