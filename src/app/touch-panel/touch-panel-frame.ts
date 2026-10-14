import { Component, ElementRef, afterNextRender, computed, input, signal, viewChild } from '@angular/core';

export type Orientation = 'landscape' | 'portrait';

/**
 * Hardware mock-up of a 10.1" touch panel. The screen is always rendered at its
 * native resolution and scaled to fit, so the projected app sees real panel pixels.
 */
@Component({
  selector: 'app-touch-panel-frame',
  templateUrl: './touch-panel-frame.html',
  styleUrl: './touch-panel-frame.scss',
  host: { '[class.portrait]': "orientation() === 'portrait'" },
})
export class TouchPanelFrame {
  readonly nativeWidth = input(1280);
  readonly nativeHeight = input(800);
  readonly orientation = input<Orientation>('landscape');
  readonly ledColor = input<'off' | 'green' | 'amber' | 'red'>('off');

  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly available = signal({ width: 0, height: 0 });

  // Bezel adds a fixed border around the screen, in native pixels.
  private readonly bezel = 56;

  readonly screenWidth = computed(() => (this.orientation() === 'landscape' ? this.nativeWidth() : this.nativeHeight()));
  readonly screenHeight = computed(() => (this.orientation() === 'landscape' ? this.nativeHeight() : this.nativeWidth()));
  readonly frameWidth = computed(() => this.screenWidth() + this.bezel * 2);
  readonly frameHeight = computed(() => this.screenHeight() + this.bezel * 2);

  readonly scale = computed(() => {
    const { width, height } = this.available();
    if (!width || !height) return 0;
    return Math.min(width / this.frameWidth(), height / this.frameHeight(), 1);
  });

  constructor() {
    afterNextRender(() => {
      const el = this.stage().nativeElement;
      const observer = new ResizeObserver(([entry]) => {
        this.available.set({ width: entry.contentRect.width, height: entry.contentRect.height });
      });
      observer.observe(el);
    });
  }
}
