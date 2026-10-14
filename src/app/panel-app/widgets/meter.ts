import { Component, computed, input } from '@angular/core';
import { QsysControl } from '../../core/qsys-control';

/** Read-only bar meter driven by a control's Position. */
@Component({
  selector: 'qs-meter',
  template: `
    <span class="label">{{ label() }}</span>
    <div class="bar" [class.reduction]="reduction()">
      <div class="fill" [style.--p]="level()"></div>
    </div>
    <span class="readout">{{ control().available() ? control().string() : '—' }}</span>
  `,
  styles: `
    :host { display: flex; flex-direction: column; align-items: center; gap: 12px; height: 100%; min-height: 0; }
    .label { font-size: 18px; color: var(--muted); white-space: nowrap; }
    .readout { font-size: 18px; font-variant-numeric: tabular-nums; min-width: 90px; text-align: center; }
    .bar { position: relative; flex: 1; width: 28px; min-height: 0; border-radius: 6px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--line); overflow: hidden; }
    .fill { position: absolute; inset: 0; background: linear-gradient(to top, var(--ok) 0%, var(--ok) 70%, var(--warn) 85%, var(--bad) 100%);
      clip-path: inset(calc((1 - var(--p)) * 100%) 0 0 0); transition: clip-path 0.12s linear; }
    .reduction .fill { background: var(--warn); clip-path: inset(0 0 calc((1 - var(--p)) * 100%) 0); }
  `,
})
export class Meter {
  readonly control = input.required<QsysControl>();
  readonly label = input('');
  /** Gain-reduction style: draws down from the top as Position falls from 1. */
  readonly reduction = input(false);

  protected readonly level = computed(() => {
    const p = this.control().position();
    return this.reduction() ? 1 - p : p;
  });
}
