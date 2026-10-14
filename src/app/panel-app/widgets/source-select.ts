import { Component, computed, inject, input } from '@angular/core';
import { QsysService } from '../../core/qsys.service';
import { QsysControl } from '../../core/qsys-control';

interface Source {
  label: string;
  control: QsysControl;
}

const DECODER = 'Decoder';
const SELECT = 'hdmi.out.1.select';

// Map the switcher's pretty-name choices ("HDMI 2", "AV 3", "Graphic 1") to the select button controls.
const KINDS: Record<string, string> = { HDMI: 'hdmi', AV: 'avh', Graphic: 'graphic' };

/** Source buttons for the Decoder's HDMI output, built from the Core's own choice list. */
@Component({
  selector: 'qs-display-sources',
  template: `
    @for (s of sources(); track s.label) {
      <button type="button" class="qs-btn" [class.on]="active() === s.label" (click)="s.control.set(true)">
        {{ s.label }}
      </button>
    } @empty {
      <span class="empty">No sources reported by the switcher.</span>
    }
  `,
  styles: `
    :host { display: grid; grid-template-columns: repeat(var(--cols, 5), 1fr); gap: 12px; }
    .qs-btn { padding: 0 8px; white-space: nowrap; font-size: 19px; }
    .empty { color: var(--muted); font-size: 18px; }
  `,
})
export class DisplaySources {
  private readonly qsys = inject(QsysService);
  readonly only = input<string[] | null>(null);

  private readonly prettyName = this.qsys.control(DECODER, `${SELECT}.pretty.name`);
  protected readonly active = this.prettyName.string;

  protected readonly sources = computed<Source[]>(() => {
    const choices = this.prettyName.state()?.Choices ?? [];
    const only = this.only();
    return choices
      .filter((label) => !only || only.includes(label))
      .flatMap((label) => {
        const m = /^(HDMI|AV|Graphic) (\d+)$/.exec(label);
        if (!m) return [];
        return [{ label, control: this.qsys.control(DECODER, `${SELECT}.${KINDS[m[1]]}.${m[2]}`) }];
      });
  });
}

/** Buttons choosing which camera feeds CamRouter output 1 (the far-end / USB camera). */
@Component({
  selector: 'qs-camera-route',
  template: `
    @for (i of inputs; track i) {
      <button type="button" class="qs-btn" [class.on]="selected() === i" [class.disabled]="!select.available()" (click)="select.set(i)">
        <span class="num">{{ i }}</span>
        <span class="name">{{ name(i) }}</span>
      </button>
    }
  `,
  styles: `
    :host { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .qs-btn { flex-direction: column; gap: 2px; padding: 10px 12px; }
    .num { font-size: 26px; font-weight: 600; }
    .name { font-size: 14px; opacity: 0.8; overflow: hidden; text-overflow: ellipsis; max-width: 100%; white-space: nowrap; }
  `,
})
export class CameraRoute {
  private readonly qsys = inject(QsysService);

  protected readonly inputs = [1, 2, 3];
  protected readonly select = this.qsys.control('CamRouter', 'output.1.select');
  protected readonly selected = this.select.value;

  protected name(i: number): string {
    return this.qsys.control('CamRouter', `input.${i}.source.name`).string() || `Camera ${i}`;
  }
}
