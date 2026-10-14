import { Component, computed, inject, input } from '@angular/core';
import { QsysService } from '../../core/qsys.service';

/**
 * Live still from a Q-SYS camera component. The camera's `jpeg.data` control
 * carries a JSON payload with the frame as base64 in `IconData`.
 */
@Component({
  selector: 'qs-camera-snapshot',
  template: `
    @if (src(); as s) {
      <img [src]="s" alt="" draggable="false" />
    } @else {
      <span class="none">No image</span>
    }
    @if (privacy()) {
      <span class="privacy">Privacy on</span>
    }
  `,
  styles: `
    :host { position: relative; display: grid; place-items: center; overflow: hidden; border-radius: 16px; background: #050608; box-shadow: inset 0 0 0 1px var(--line); aspect-ratio: 16 / 9; }
    img { width: 100%; height: 100%; object-fit: cover; }
    .none { color: var(--muted); font-size: 18px; }
    .privacy { position: absolute; top: 12px; left: 12px; padding: 6px 12px; border-radius: 8px; background: rgb(0 0 0 / 65%); color: var(--warn); font-size: 16px; }
  `,
})
export class CameraSnapshot {
  private readonly qsys = inject(QsysService);
  readonly camera = input.required<string>();

  private readonly data = computed(() => this.qsys.control(this.camera(), 'jpeg.data'));
  protected readonly privacy = computed(() => this.qsys.control(this.camera(), 'toggle.privacy').bool());

  protected readonly src = computed(() => {
    const raw = this.data().string();
    if (!raw) return null;
    try {
      const icon = JSON.parse(raw)?.IconData;
      return icon ? `data:image/jpeg;base64,${icon}` : null;
    } catch {
      return null;
    }
  });
}
