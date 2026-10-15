import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';

/** Number that counts up from zero with an ease-out when created. */
@Component({
  selector: 'deck-count-up',
  template: `{{ display() }}`,
  styles: ':host { font-variant-numeric: tabular-nums; }',
})
export class CountUp implements OnInit {
  readonly to = input.required<number>();
  readonly duration = input(1600);
  readonly delay = input(0);
  readonly prefix = input('');

  protected readonly display = signal('0');
  private frame = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      cancelAnimationFrame(this.frame);
      clearTimeout(this.timer);
    });
  }

  ngOnInit(): void {
    this.display.set(this.prefix() + '0');
    this.timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / this.duration());
        const eased = 1 - Math.pow(1 - t, 4);
        this.display.set(this.prefix() + Math.round(this.to() * eased).toLocaleString('en-GB'));
        if (t < 1) this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }, this.delay());
  }
}
