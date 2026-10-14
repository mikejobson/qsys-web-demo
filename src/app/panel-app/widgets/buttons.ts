import { Component, input } from '@angular/core';
import { QsysControl } from '../../core/qsys-control';

/** Latching button: tap flips a Boolean control; lit while the control is true. */
@Component({
  selector: 'qs-toggle',
  template: `<ng-content />`,
  host: {
    class: 'qs-btn',
    role: 'switch',
    '[attr.aria-checked]': 'control().bool()',
    '[class.on]': 'control().bool()',
    '[class.danger]': "tone() === 'danger'",
    '[class.disabled]': '!control().available()',
    '(click)': 'control().toggle()',
  },
})
export class ToggleButton {
  readonly control = input.required<QsysControl>();
  readonly tone = input<'accent' | 'danger'>('accent');
}

/** Momentary button: true while held, false on release (camera PTZ etc). */
@Component({
  selector: 'qs-momentary',
  template: `<ng-content />`,
  host: {
    class: 'qs-btn',
    role: 'button',
    '[class.on]': 'control().bool()',
    '[class.disabled]': '!control().available()',
    '(pointerdown)': 'press($event)',
    '(pointerup)': 'release()',
    '(pointercancel)': 'release()',
    '(lostpointercapture)': 'release()',
  },
})
export class MomentaryButton {
  readonly control = input.required<QsysControl>();
  private held = false;

  protected press(e: PointerEvent): void {
    if (!this.control().available()) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.held = true;
    this.control().set(true);
  }

  protected release(): void {
    if (!this.held) return;
    this.held = false;
    this.control().set(false);
  }
}
