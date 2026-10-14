import { Component, computed, inject } from '@angular/core';
import { QsysService } from '../../core/qsys.service';
import { Fader } from '../widgets/fader';
import { ToggleButton } from '../widgets/buttons';
import { CameraSnapshot } from '../widgets/camera-snapshot';
import { CameraRoute, DisplaySources } from '../widgets/source-select';

@Component({
  selector: 'app-home-page',
  imports: [Fader, ToggleButton, CameraSnapshot, CameraRoute, DisplaySources],
  template: `
    <div class="left">
      <section class="card">
        <h2 class="card-title">Room volume</h2>
        <div class="volume">
          <qs-fader class="fader" orientation="horizontal" [control]="volume" />
          <qs-toggle class="mute" tone="danger" [control]="mute">{{ mute.bool() ? 'Muted' : 'Mute' }}</qs-toggle>
        </div>
      </section>

      <section class="card grow">
        <h2 class="card-title">Display <small>{{ showing.string() || '—' }}</small></h2>
        <qs-display-sources />
      </section>
    </div>

    <section class="card">
      <h2 class="card-title">Conference camera <small>{{ routedName() }}</small></h2>
      <qs-camera-snapshot [camera]="routedCamera()" />
      <qs-camera-route />
    </section>
  `,
  styles: `
    :host { display: grid; grid-template-columns: 1.1fr 1fr; gap: 24px; height: 100%; }
    .left { display: flex; flex-direction: column; gap: 24px; min-height: 0; }
    .grow { flex: 1; }
    .grow qs-display-sources { flex: 1; grid-auto-rows: 1fr; }
    .volume { display: flex; align-items: center; gap: 20px; }
    .fader { flex: 1; }
    .mute { width: 140px; }
  `,
})
export class HomePage {
  private readonly qsys = inject(QsysService);

  protected readonly volume = this.qsys.control('MainGain', 'gain');
  protected readonly mute = this.qsys.control('MainGain', 'mute');
  protected readonly showing = this.qsys.control('Decoder', 'hdmi.out.1.select.active.source.name');

  private readonly route = this.qsys.control('CamRouter', 'output.1.select');
  protected readonly routedCamera = computed(() => `Cam-${this.route.value() || 1}`);
  protected readonly routedName = this.qsys.control('CamRouter', 'output.1.source.name').string;
}
