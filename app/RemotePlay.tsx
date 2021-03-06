import Redux from 'redux'
import {RemotePlayEvent, RemotePlayEventBody, ActionEvent, StatusEvent, ClientID} from 'expedition-qdl/lib/remote/Events'
import {ClientBase} from 'expedition-qdl/lib/remote/Client'
import {local} from './actions/RemotePlay'
import {getStore} from './Store'
import * as Bluebird from 'bluebird'
import {remotePlaySettings} from './Constants'

const REMOTEPLAY_CLIENT_STATUS_POLL_MS = 5000;

// Max reconnect time is slot_time * 2^(slot_idx) + base = 10440 ms
const RECONNECT_MAX_SLOT_IDX = 10;
const RECONNECT_SLOT_DELAY_MS = 10;
const RECONNECT_DELAY_BASE_MS = 200;

// This is the base layer of the remote play network framework, implemented
// using firebase FireStore.
export class RemotePlayClient extends ClientBase {
  private session: WebSocket;
  private sessionClientIDs: string[];
  private reconnectAttempts: number;
  private sessionID: string;
  private secret: string;

  // Mirrors the committed counter on the websocket server.
  // Used to maintain a transactional event queue.
  private localEventCounter: number;

  constructor() {
    super();
    this.reconnectAttempts = 0;

    // Websocket timeout defaults to ~55 seconds. We send a periodic
    // packet to the server to keep it advised that we're still connected.
    setInterval(() => {this.keepalive();}, 40);
  }

  private keepalive() {
    if (this.isConnected()) {
      this.session.send('PING');
    }
  }

  // This crafts a key that can be used to populate maps of client information
  // (e.g. past StatusEvents in redux store)
  getClientKey(): string {
    return this.id+'|'+this.instance;
  }

  reconnect() {
    if (this.session) {
      this.session.close();
    }

    // Random exponential backoff reconnect
    // https://en.wikipedia.org/wiki/Exponential_backoff
    const slot_idx = Math.floor(Math.random() * (this.reconnectAttempts+1))
    const slot = Math.pow(2,slot_idx);
    const delay = RECONNECT_SLOT_DELAY_MS * slot + RECONNECT_DELAY_BASE_MS;
    console.log(`WS: Waiting to reconnect (${delay} ms)`);
    setTimeout(() => {
      console.log('WS: reconnecting...');
      this.connect(this.sessionID, this.secret);
    }, delay);
    this.reconnectAttempts = Math.min(this.reconnectAttempts + 1, RECONNECT_MAX_SLOT_IDX);
  }

  connect(sessionID: string, secret: string): void {
    // Save these for reconnect
    this.sessionID = sessionID;
    this.secret = secret;

    if (this.isConnected()) {
      this.disconnect();
    }
    this.sessionClientIDs = [this.id];
    this.localEventCounter = 0;

    this.session = new WebSocket(`${remotePlaySettings.websocketSession}/${sessionID}?client=${this.id}&instance=${this.instance}&secret=${secret}`);

    this.session.onmessage = (ev: MessageEvent) => {
      const parsed = JSON.parse(ev.data) as RemotePlayEvent;
      if (parsed.id) {
        this.localEventCounter = parsed.id;
      }
      this.handleMessage(parsed);
    };

    this.session.onerror = (ev: ErrorEvent) => {
      console.error(ev);
    };

    this.session.onclose = (ev: CloseEvent) => {
      switch (ev.code) {
        case 1000:  // CLOSE_NORMAL
          console.log('WS: closed normally');
          break;
        default:  // Abnormal closure
          console.error('WS: abnormal closure');
          this.reconnect();
          break;
      }

      // Notify listeners that we've disconnected
      this.publish({
        id: null,
        client: this.id,
        instance: this.instance,
        event: {
          type: 'STATUS',
          connected: false,
        },
      });
    };

    const settings = getStore().getState().settings;
    this.session.onopen = () => {
      console.log('WS: open');
      this.connected = true;
      const event: StatusEvent = {
        type: 'STATUS',
        connected: true,
        numPlayers: (settings && settings.numPlayers) || 1,
      };
      // Send remote and also publish locally
      this.sendEvent(event);
      this.publish({
        id: null,
        client: this.id,
        instance: this.instance,
        event,
      });
    }
  }

  disconnect() {
    this.session.close();
    this.connected = false;
  }

  sendFinalizedEvent(event: RemotePlayEvent): void {
    const start = Date.now();

    if (event.event.type === 'ACTION') {
      this.localEventCounter++;
      event.id = this.localEventCounter;
    }
    console.log(event);
    this.session.send(JSON.stringify(event));
  }

  public createActionMiddleware(): Redux.Middleware {
    return ({dispatch, getState}: Redux.MiddlewareAPI<any>) => (next: Redux.Dispatch<any>) => (action: any) => {
      const dispatchLocal = (a: Redux.Action) => {dispatch(local(a));};

      if (!action) {
        next(action);
        return;
      }

      let inflight: number = (action as any)._inflight;
      const localOnly = (action.type === 'LOCAL');

      if (localOnly) {
        // Unwrap local actions, passing through inflight data.
        action = action.action;
      }

      if (action instanceof Array) {
        const [name, fn, args] = action;
        if (this.isConnected() && !localOnly && !inflight) {
          inflight = this.localEventCounter+1;
        }

        // TODO: Handle txn mismatch when remoteArgs is null
        const remoteArgs = fn(args, (a: Redux.Action) => {
          // Assign an inflight transaction ID to be consumed by the inflight() reducer
          if (inflight) {
            (a as any)._inflight=inflight;
          }
          return dispatchLocal(a);
        }, getState);

        if (remoteArgs !== null && remoteArgs !== undefined && !localOnly) {
          const argstr = JSON.stringify(remoteArgs);
          console.log('WS: outbound ' + name + '(' + argstr + ') ' + inflight);
          this.sendEvent({type: 'ACTION', name, args: argstr} as ActionEvent);
        }
      } else if (typeof(action) === 'function') {
        if (inflight !== undefined) {
          action((a: Redux.Action) => {
            (a as any)._inflight = inflight;
            dispatchLocal(a);
          }, getState);
        } else {
          // Dispatch async actions
          action(dispatchLocal, getState);
        }
      } else {
        // Pass through regular action objects
        next(action);
      }
    }
  }
}

// TODO: Proper device ID
let client: RemotePlayClient = null;
export function getRemotePlayClient(): RemotePlayClient {
  if (client !== null) {
    return client
  }
  client = new RemotePlayClient();
  return client;
}

