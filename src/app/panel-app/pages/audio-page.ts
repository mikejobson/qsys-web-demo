import { Component, inject } from '@angular/core';
import { QsysService } from '../../core/qsys.service';
import { Fader } from '../widgets/fader';
import { Meter } from '../widgets/meter';
import { ToggleButton } from '../widgets/buttons';

@Component({
  selector: 'app-audio-page',
  imports: [Fader, Meter, ToggleButton],
  template: `
    <section class="card strips">
      <h2 class="card-title">Levels</h2>
      <div class="row">
        <div class="strip">
          <qs-fader label="Main" [control]="c('MainGain', 'gain')" />
          <qs-toggle tone="danger" [control]="c('MainGain', 'mute')">Mute</qs-toggle>
        </div>
        <div class="strip">
          <qs-fader label="Gain" [control]="c('Gain', 'gain')" />
          <qs-toggle tone="danger" [control]="c('Gain', 'mute')">Mute</qs-toggle>
        </div>
        <div class="strip">
          <qs-fader label="EQ trim" [control]="c('MainEQ', 'master.gain')" />
          <qs-toggle [control]="c('MainEQ', 'bypass')">Bypass</qs-toggle>
        </div>
        <div class="strip">
          <qs-fader label="Delay" [control]="c('MainDelay', 'delay.1')" />
          <qs-toggle [control]="c('MainDelay', 'bypass.1')">Bypass</qs-toggle>
        </div>
      </div>
    </section>

    <section class="card strips">
      <h2 class="card-title">Limiter</h2>
      <div class="row">
        <div class="strip">
          <qs-fader label="Threshold" [control]="c('MainLimiter', 'threshold.level')" />
          <qs-toggle [control]="c('MainLimiter', 'bypass')">Bypass</qs-toggle>
        </div>
        <div class="strip meters">
          <div class="meter-pair">
            <qs-meter label="Level" [control]="c('MainLimiter', 'detector.level')" />
            <qs-meter label="GR" [reduction]="true" [control]="c('MainLimiter', 'applied.gain')" />
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; height: 100%; }
    .strips { height: 100%; }
    .row { flex: 1; display: flex; justify-content: space-around; gap: 16px; min-height: 0; }
    .strip { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 150px; min-height: 0; }
    .strip qs-fader { flex: 1; }
    .strip .qs-btn { width: 100%; }
    .meter-pair { flex: 1; display: flex; gap: 8px; min-height: 0; }
  `,
})
export class AudioPage {
  private readonly qsys = inject(QsysService);

  protected c(component: string, control: string) {
    return this.qsys.control(component, control);
  }
}
