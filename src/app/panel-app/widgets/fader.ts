import { Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';
import { QsysControl } from '../../core/qsys-control';

/** Touch fader bound to a control's Position (0–1). */
@Component({
  selector: 'qs-fader',
  template: `
    @if (label()) {
      <span class="label">{{ label() }}</span>
    }
    <div
      #track
      class="track"
      [class.disabled]="!control().available()"
      (pointerdown)="start($event)"
      (pointermove)="move($event)"
      (pointerup)="end($event)"
      (pointercancel)="end($event)"
    >
      <div class="fill" [style.--p]="position()"></div>
      <div class="thumb" [style.--p]="position()"></div>
    </div>
    <span class="readout">{{ control().available() ? control().string() : '—' }}</span>
  `,
  styleUrl: './fader.scss',
  host: { '[class.horizontal]': "orientation() === 'horizontal'" },
})
export class Fader {
  readonly control = input.required<QsysControl>();
  readonly label = input('');
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly dragPosition = signal<number | null>(null);

  // While dragging show the finger position, otherwise what the Core reports.
  protected readonly position = computed(() => this.dragPosition() ?? this.control().position());

  protected start(e: PointerEvent): void {
    if (!this.control().available()) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this.apply(e);
  }

  protected move(e: PointerEvent): void {
    if (this.dragPosition() !== null) this.apply(e);
  }

  protected end(e: PointerEvent): void {
    if (this.dragPosition() === null) return;
    this.apply(e);
    this.dragPosition.set(null);
  }

  private apply(e: PointerEvent): void {
    const rect = this.track().nativeElement.getBoundingClientRect();
    const raw =
      this.orientation() === 'horizontal'
        ? (e.clientX - rect.left) / rect.width
        : 1 - (e.clientY - rect.top) / rect.height;
    const p = Math.min(1, Math.max(0, raw));
    this.dragPosition.set(p);
    this.control().set({ Position: p });
  }
}
