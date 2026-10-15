import { Injectable, computed, signal } from '@angular/core';
import { Qrwc, type IEngineStatus } from '@q-sys/qrwc';
import { QsysControl } from './qsys-control';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export interface ConnectionSettings {
  host: string;
  secure: boolean;
  apiKey: string;
  pollingInterval: number;
}

export interface ComponentSummary {
  name: string;
  type: string;
  controlCount: number;
}

export interface LogEntry {
  time: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
}

const SETTINGS_KEY = 'qsys-web-demo.connection';
const MAX_LOG_ENTRIES = 200;

const DEFAULT_SETTINGS: ConnectionSettings = {
  host: '',
  secure: false,
  apiKey: '',
  pollingInterval: 150,
};

/**
 * Owns the single QRWC connection to a Q-SYS Core and exposes its state as signals.
 * Uses QRWC managed mode, so dropped links are retried by the library itself.
 */
@Injectable({ providedIn: 'root' })
export class QsysService {
  private qrwc: Qrwc | undefined;
  // Bumped on every connect/disconnect so stale async results can be discarded.
  private attempt = 0;
  private readonly bindings = new Map<string, QsysControl>();

  readonly settings = signal<ConnectionSettings>(loadSettings());
  readonly state = signal<ConnectionState>('disconnected');
  readonly engineStatus = signal<IEngineStatus | null>(null);
  readonly components = signal<ComponentSummary[]>([]);
  readonly connectedAt = signal<Date | null>(null);
  readonly log = signal<LogEntry[]>([]);

  readonly isConnected = computed(() => this.state() === 'connected');
  readonly isBusy = computed(() => this.state() === 'connecting' || this.state() === 'reconnecting');

  /** The live QRWC instance, for the controls phase. Undefined unless connected. */
  get instance(): Qrwc | undefined {
    return this.qrwc;
  }

  /**
   * Reactive handle for a control, e.g. `qsys.control('MainGain', 'gain')`.
   * Handles are shared and survive reconnects, so components can grab them once.
   */
  control(component: string, name: string): QsysControl {
    const key = `${component}:${name}`;
    let binding = this.bindings.get(key);
    if (!binding) {
      binding = new QsysControl(component, name, this.qrwc?.components[component]?.controls[name]);
      this.bindings.set(key, binding);
    }
    return binding;
  }

  async connect(settings: ConnectionSettings): Promise<void> {
    const host = settings.host.trim();
    if (!host) {
      this.addLog('error', 'Enter a Core IP address or hostname.');
      return;
    }

    this.teardown();
    this.settings.set({ ...settings, host });
    saveSettings(this.settings());

    const attempt = ++this.attempt;
    const url = `${settings.secure ? 'wss' : 'ws'}://${host}`;
    this.state.set('connecting');
    this.addLog('info', `Connecting to ${url}/qrc-public-api/v0 …`);

    const qrwc = await Qrwc.createQrwc({
      host: url,
      apiKey: settings.apiKey || undefined,
      pollingInterval: settings.pollingInterval,
      timeout: 5000,
      reconnect: { maxAttempts: 2, delay: 2000, maxDelay: 10000, backoffFactor: 2 },
      logger: {
        info: (msg: unknown) => this.addLog('info', describe(msg)),
        warn: (msg: unknown) => this.addLog('warn', describe(msg)),
        error: (msg: unknown) => this.addLog('error', describe(msg)),
      },
    });

    if (attempt !== this.attempt) {
      // User cancelled or started a new connection while this one was in flight.
      qrwc?.close();
      return;
    }

    if (!qrwc) {
      this.state.set('failed');
      this.addLog('error', `Could not connect to ${host}. Check the IP, that the Core is running a design, and that QRWC is reachable.`);
      return;
    }

    this.qrwc = qrwc;
    for (const b of this.bindings.values()) {
      b.attach(qrwc.components[b.component]?.controls[b.name]);
    }
    this.engineStatus.set({ ...qrwc.engineStatus });
    this.components.set(summarise(qrwc));
    this.connectedAt.set(new Date());
    this.state.set('connected');
    this.addLog('info', `Connected — ${this.components().length} scriptable component(s) found.`);

    qrwc.on('update', (component, control, state) => {
      if (attempt !== this.attempt) return;
      this.bindings.get(`${component.name}:${control.name}`)?.receive(state);
    });
    qrwc.on('engineStatus', (status) => {
      if (attempt !== this.attempt) return;
      this.engineStatus.set({ ...status });
      this.addLog('info', `Engine status: ${status.State}${status.DesignName ? ` (${status.DesignName})` : ''}`);
    });
    qrwc.on('disconnected', (reason) => {
      if (attempt !== this.attempt) return;
      this.addLog('warn', `Disconnected: ${reason}`);
      if (reason === 'reconnection failed') {
        this.qrwc = undefined;
        this.detachAll();
        this.connectedAt.set(null);
        this.state.set('failed');
      } else {
        this.state.set('reconnecting');
      }
    });
    qrwc.on('reconnected', () => {
      if (attempt !== this.attempt) return;
      this.engineStatus.set({ ...qrwc.engineStatus });
      this.connectedAt.set(new Date());
      this.state.set('connected');
      this.addLog('info', 'Reconnected.');
    });
    qrwc.on('error', (error) => {
      if (attempt !== this.attempt) return;
      this.addLog('error', error.message);
    });
  }

  disconnect(): void {
    const wasActive = this.state() !== 'disconnected' && this.state() !== 'failed';
    this.attempt++;
    this.teardown();
    this.state.set('disconnected');
    if (wasActive) this.addLog('info', 'Disconnected by user.');
  }

  clearLog(): void {
    this.log.set([]);
  }

  private teardown(): void {
    this.qrwc?.close();
    this.qrwc = undefined;
    this.detachAll();
    this.engineStatus.set(null);
    this.components.set([]);
    this.connectedAt.set(null);
  }

  private detachAll(): void {
    for (const b of this.bindings.values()) b.attach(undefined);
  }

  private addLog(level: LogEntry['level'], message: string): void {
    this.log.update((entries) => [{ time: new Date(), level, message }, ...entries].slice(0, MAX_LOG_ENTRIES));
  }
}

function summarise(qrwc: Qrwc): ComponentSummary[] {
  return Object.values(qrwc.components)
    .filter((c) => !!c)
    .map((c) => ({
      name: c!.name,
      type: c!.state.Type,
      controlCount: Object.keys(c!.controls).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function describe(msg: unknown): string {
  if (msg instanceof Error) return msg.message;
  if (typeof msg === 'string') return msg;
  if (msg && typeof msg === 'object' && 'type' in msg && msg.type === 'error') return 'WebSocket error (Core unreachable or refused the connection).';
  try {
    return JSON.stringify(msg);
  } catch {
    return String(msg);
  }
}

function loadSettings(): ConnectionSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: ConnectionSettings): void {
  try {
    // Saved alongside the IP (including the access key) so the form is pre-filled
    // next time. Nothing connects automatically.
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable — settings just won't persist.
  }
}
