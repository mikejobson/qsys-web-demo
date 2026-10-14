import { Component, inject, signal } from '@angular/core';
import { QsysService } from '../../core/qsys.service';
import { QsysControl } from '../../core/qsys-control';
import { MomentaryButton, ToggleButton } from '../widgets/buttons';
import { CameraSnapshot } from '../widgets/camera-snapshot';

const SAVE_HOLD_MS = 1500;

@Component({
  selector: 'app-camera-page',
  imports: [MomentaryButton, ToggleButton, CameraSnapshot],
  template: `
    <section class="card view">
      <div class="cams">
        @for (cam of cameras; track cam) {
          <button type="button" class="qs-btn" [class.on]="camera() === cam" (click)="camera.set(cam)">
            <span>{{ c('camera.name', cam).string() || cam }}</span>
          </button>
        }
      </div>
      <qs-camera-snapshot [camera]="camera()" />
      <div class="toggles">
        <qs-toggle tone="danger" [control]="c('toggle.privacy')">Privacy</qs-toggle>
        <qs-toggle [control]="c('autoframe.enable')">Auto framing</qs-toggle>
        <span class="moving" [class.on]="c('is.moving').bool()">Moving</span>
      </div>
    </section>

    <section class="card controls">
      <h2 class="card-title">Pan / tilt / zoom</h2>
      <div class="ptz">
        <div class="pad">
          <qs-momentary [control]="c('pan.left.tilt.up')">↖</qs-momentary>
          <qs-momentary [control]="c('tilt.up')">▲</qs-momentary>
          <qs-momentary [control]="c('pan.right.tilt.up')">↗</qs-momentary>
          <qs-momentary [control]="c('pan.left')">◀</qs-momentary>
          <button type="button" class="qs-btn home" (click)="c('preset.home.load.trigger').trigger()">Home</button>
          <qs-momentary [control]="c('pan.right')">▶</qs-momentary>
          <qs-momentary [control]="c('pan.left.tilt.down')">↙</qs-momentary>
          <qs-momentary [control]="c('tilt.down')">▼</qs-momentary>
          <qs-momentary [control]="c('pan.right.tilt.down')">↘</qs-momentary>
        </div>
        <div class="zoom">
          <qs-momentary [control]="c('zoom.in')">＋</qs-momentary>
          <span>Zoom</span>
          <qs-momentary [control]="c('zoom.out')">－</qs-momentary>
        </div>
      </div>

      <h2 class="card-title">Presets <small class="hint">{{ savedMessage() || 'Hold to save' }}</small></h2>
      <div class="presets">
        @for (n of presets; track n) {
          <button
            type="button"
            class="qs-btn"
            [class.on]="c('preset.' + n + '.load.state').bool()"
            [class.saving]="holding() === n"
            [class.disabled]="!c('preset.' + n + '.load.trigger').available()"
            (pointerdown)="pressPreset(n)"
            (pointerup)="releasePreset(n)"
            (pointerleave)="cancelPreset()"
            (pointercancel)="cancelPreset()"
          >
            {{ n }}
          </button>
        }
      </div>
    </section>
  `,
  styles: `
    :host { display: grid; grid-template-columns: 1.15fr 1fr; gap: 24px; height: 100%; }
    .view { justify-content: space-between; }
    .cams { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .cams .qs-btn { min-height: 60px; padding: 0 10px; font-size: 15px; }
    .cams .qs-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .toggles { display: flex; gap: 12px; align-items: center; }
    .toggles .qs-btn { min-height: 60px; flex: 1; }
    .moving { padding: 0 8px; font-size: 16px; color: var(--muted); opacity: 0.35; }
    .moving.on { color: var(--warn); opacity: 1; }
    .ptz { display: flex; gap: 24px; align-items: stretch; }
    .pad { display: grid; grid-template-columns: repeat(3, 84px); grid-auto-rows: 84px; gap: 10px; }
    .pad .qs-btn { min-height: 0; padding: 0; font-size: 28px; }
    .pad .home { font-size: 17px; }
    .zoom { display: flex; flex-direction: column; gap: 10px; align-items: center; justify-content: space-between; flex: 1; }
    .zoom .qs-btn { width: 100%; flex: 1; font-size: 34px; }
    .zoom span { font-size: 16px; color: var(--muted); }
    .presets { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
    .presets .qs-btn { min-height: 64px; padding: 0; font-size: 22px; position: relative; overflow: hidden; }
    .presets .qs-btn::after { content: ''; position: absolute; left: 0; bottom: 0; height: 5px; width: 0; background: var(--warn); }
    .presets .qs-btn.saving::after { width: 100%; transition: width ${SAVE_HOLD_MS}ms linear; }
    .hint { color: var(--muted) !important; font-size: 15px !important; }
  `,
})
export class CameraPage {
  private readonly qsys = inject(QsysService);

  protected readonly cameras = ['Cam-1', 'Cam-2', 'Cam-3'];
  protected readonly presets = [1, 2, 3, 4, 5, 6];
  protected readonly camera = signal('Cam-1');
  protected readonly holding = signal<number | null>(null);
  protected readonly savedMessage = signal('');

  private holdTimer: ReturnType<typeof setTimeout> | undefined;
  private saved = false;

  /** Control on the selected camera (or a specific one). */
  protected c(name: string, camera = this.camera()): QsysControl {
    return this.qsys.control(camera, name);
  }

  protected pressPreset(n: number): void {
    this.cancelPreset();
    this.saved = false;
    this.holding.set(n);
    this.holdTimer = setTimeout(() => {
      this.saved = true;
      this.holding.set(null);
      this.c(`preset.${n}.save.trigger`).trigger();
      this.flash(`Preset ${n} saved`);
    }, SAVE_HOLD_MS);
  }

  protected releasePreset(n: number): void {
    const wasHolding = this.holding() === n;
    this.cancelPreset();
    if (wasHolding && !this.saved) this.c(`preset.${n}.load.trigger`).trigger();
  }

  protected cancelPreset(): void {
    clearTimeout(this.holdTimer);
    this.holding.set(null);
  }

  private flash(message: string): void {
    this.savedMessage.set(message);
    setTimeout(() => this.savedMessage.set(''), 2000);
  }
}
