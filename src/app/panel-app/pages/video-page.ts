import { Component, computed, inject } from '@angular/core';
import { QsysService } from '../../core/qsys.service';
import { CameraSnapshot } from '../widgets/camera-snapshot';
import { CameraRoute, DisplaySources } from '../widgets/source-select';

@Component({
  selector: 'app-video-page',
  imports: [CameraSnapshot, CameraRoute, DisplaySources],
  template: `
    <section class="card">
      <h2 class="card-title">Display source <small>{{ showing.string() || '—' }}</small></h2>
      <qs-display-sources class="sources" />
    </section>

    <section class="card">
      <h2 class="card-title">Camera to far end <small>{{ routedName() }}</small></h2>
      <qs-camera-snapshot [camera]="routedCamera()" />
      <qs-camera-route />
    </section>
  `,
  styles: `
    :host { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; height: 100%; }
    .sources { --cols: 2; flex: 1; grid-auto-rows: 1fr; }
  `,
})
export class VideoPage {
  private readonly qsys = inject(QsysService);

  protected readonly showing = this.qsys.control('Decoder', 'hdmi.out.1.select.active.source.name');
  private readonly route = this.qsys.control('CamRouter', 'output.1.select');
  protected readonly routedCamera = computed(() => `Cam-${this.route.value() || 1}`);
  protected readonly routedName = this.qsys.control('CamRouter', 'output.1.source.name').string;
}
