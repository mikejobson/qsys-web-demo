import { Signal, WritableSignal, computed, signal } from '@angular/core';
import type { Control, IControlState, IQrwcExpandedGenericParameter } from '@q-sys/qrwc';

// Untyped design: any component/control name.
type AnyControl = Control<IQrwcExpandedGenericParameter, string, string>;

export type ControlValue = string | number | boolean | { Value?: number; Position?: number; String?: string; Bool?: boolean };

/**
 * Reactive handle to one Q-SYS control. Stays valid across disconnects/reconnects;
 * `state` is null whenever the control isn't available on the connected Core.
 */
export class QsysControl {
  private readonly _state: WritableSignal<IControlState | null>;
  private control: AnyControl | undefined;
  private inFlight = false;
  private pending: { value: ControlValue } | null = null;

  readonly state: Signal<IControlState | null>;
  readonly available: Signal<boolean>;
  readonly bool: Signal<boolean>;
  readonly value: Signal<number>;
  readonly position: Signal<number>;
  readonly string: Signal<string>;

  // Initial state is passed in rather than set via attach(), because handles are
  // often created lazily from templates/computeds where signal writes aren't allowed.
  constructor(
    readonly component: string,
    readonly name: string,
    control: AnyControl | undefined,
  ) {
    this.control = control;
    this._state = signal(control ? control.state : null);
    this.state = this._state.asReadonly();
    this.available = computed(() => this._state() !== null);
    this.bool = computed(() => this._state()?.Bool ?? false);
    this.value = computed(() => this._state()?.Value ?? 0);
    this.position = computed(() => this._state()?.Position ?? 0);
    this.string = computed(() => this._state()?.String ?? '');
  }

  /** Called by QsysService when the connection (and so the underlying Control) changes. */
  attach(control: AnyControl | undefined): void {
    this.control = control;
    this.pending = null;
    this._state.set(control ? control.state : null);
  }

  /** Called by QsysService for every change the Core reports. */
  receive(state: IControlState): void {
    this._state.set(state);
  }

  /**
   * Send a value to the Core. While a request is in flight only the most recent
   * value is kept, so fast fader drags don't queue up a backlog of RPCs.
   */
  set(value: ControlValue): void {
    if (!this.control) return;
    if (this.inFlight) {
      this.pending = { value };
      return;
    }
    this.inFlight = true;
    this.control
      .update(value)
      .catch(() => undefined) // errors surface through the qrwc 'error' event
      .finally(() => {
        this.inFlight = false;
        const next = this.pending;
        this.pending = null;
        if (next) this.set(next.value);
      });
  }

  toggle(): void {
    this.set(!this.bool());
  }

  trigger(): void {
    this.set(1);
  }
}
