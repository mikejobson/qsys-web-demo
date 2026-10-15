import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';

export interface TermLine {
  /** `prompt` lines are typed out character by character; others appear whole. */
  kind: 'prompt' | 'out' | 'ok' | 'dim' | 'claude';
  text: string;
  /** Extra pause in ms before this line starts. */
  pause?: number;
}

/** Fake terminal window that plays a scripted session when it is created. */
@Component({
  selector: 'deck-terminal',
  template: `
    <div class="chrome">
      <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
      <span class="title">{{ title() }}</span>
    </div>
    <div class="body">
      @for (line of shown(); track $index) {
        <div class="line" [class]="line.kind">
          @if (line.kind === 'prompt') {
            <span class="caret">›</span>
          }
          @if (line.kind === 'claude') {
            <span class="bullet">⏺</span>
          }
          <span class="text">{{ line.text }}</span>
        </div>
      }
      @if (!done()) {
        <span class="cursor"></span>
      }
    </div>
  `,
  styleUrl: './terminal.scss',
})
export class Terminal implements OnInit {
  readonly lines = input.required<TermLine[]>();
  readonly title = input('claude — ~/Developer/qsys-web-demo');
  /** Delay before playback starts, ms. */
  readonly delay = input(400);
  /** Typing speed, ms per character. */
  readonly speed = input(22);

  protected readonly shown = signal<TermLine[]>([]);
  protected readonly done = signal(false);

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  ngOnInit(): void {
    this.timer = setTimeout(() => this.play(0), this.delay());
  }

  private play(index: number): void {
    const lines = this.lines();
    if (index >= lines.length) {
      this.done.set(true);
      return;
    }
    const line = lines[index];
    const start = () => {
      if (line.kind === 'prompt') {
        this.type(line, 0, () => (this.timer = setTimeout(() => this.play(index + 1), 450)));
      } else {
        this.shown.update((s) => [...s, line]);
        this.timer = setTimeout(() => this.play(index + 1), line.kind === 'claude' ? 520 : 160);
      }
    };
    if (line.pause) this.timer = setTimeout(start, line.pause);
    else start();
  }

  private type(line: TermLine, chars: number, next: () => void): void {
    const partial = { ...line, text: line.text.slice(0, chars) };
    this.shown.update((s) => (chars === 0 ? [...s, partial] : [...s.slice(0, -1), partial]));
    if (chars >= line.text.length) {
      next();
      return;
    }
    // Type in small bursts so long prompts don't drag.
    const step = line.text.length > 120 ? 3 : 1;
    this.timer = setTimeout(() => this.type(line, chars + step, next), this.speed());
  }
}
