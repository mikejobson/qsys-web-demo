import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QsysLogo } from '../shared/qsys-logo';
import { CountUp } from './count-up';
import { Terminal, TermLine } from './terminal';

const STAGE_W = 1920;
const STAGE_H = 1080;

interface SlideInfo {
  id: string;
  label: string;
}

const SLIDES: SlideInfo[] = [
  { id: 'title', label: 'Title' },
  { id: 'brief', label: 'The brief' },
  { id: 'pipeline', label: 'What Claude did' },
  { id: 'wire', label: 'How it talks to the Core' },
  { id: 'verify', label: 'It checks its own work' },
  { id: 'discover', label: 'Discovering the Core' },
  { id: 'controls', label: 'Controls in one line' },
  { id: 'panel', label: 'The panel' },
  { id: 'judgement', label: 'Judgement' },
  { id: 'iterate', label: 'Iterate' },
  { id: 'ship', label: 'Ship it' },
  { id: 'numbers', label: 'By the numbers' },
  { id: 'live', label: 'Live demo' },
];

/**
 * "How I built this with Claude Code" deck. Rendered on a fixed 1920×1080 stage
 * scaled to the window. ← → / Space / PageUp-PageDown (clickers) to move, F for
 * fullscreen, D to jump to the live demo.
 */
@Component({
  selector: 'app-deck',
  imports: [QsysLogo, CountUp, Terminal],
  templateUrl: './deck.html',
  styleUrl: './deck.scss',
  host: {
    '(window:resize)': 'measure()',
    '(document:keydown)': 'onKey($event)',
  },
})
export class Deck {
  private readonly router = inject(Router);

  /** 1-based slide number from the URL (/present/3). */
  readonly slide = input<string>();

  protected readonly slides = SLIDES;
  protected readonly index = linkedSignal(() => {
    const n = Number(this.slide());
    return Number.isInteger(n) && n >= 1 && n <= SLIDES.length ? n - 1 : 0;
  });
  protected readonly current = computed(() => SLIDES[this.index()]);
  protected readonly direction = signal<1 | -1>(1);
  protected readonly scale = signal(1);

  // Floating hexagons behind the title and closing slides.
  protected readonly hexes = Array.from({ length: 26 }, (_, i) => {
    const r = (n: number) => ((Math.sin(i * 9301 + n * 49297) + 1) / 2) % 1;
    return {
      x: Math.round(r(1) * 1920),
      y: Math.round(r(2) * 1080),
      size: Math.round(40 + r(3) * 160),
      delay: -Math.round(r(4) * 12000),
      duration: Math.round(14000 + r(5) * 14000),
      opacity: 0.05 + r(6) * 0.16,
    };
  });

  protected readonly briefScript: TermLine[] = [
    {
      kind: 'prompt',
      text:
        "Create me a touch panel emulator on page for a 10\" touch screen. This will run an angular web app within the panel but the whole page can be the project, it's just the controls we will build for this example will be in the 'mock up' panel. This will be to control a qsys core over the npm qwrc protocol. This should be an ip which we can enter on the page itself to show connections state and test what we will control, but controls will be the next phase",
    },
    { kind: 'claude', text: "Empty repo. I'll scaffold an Angular app and install @q-sys/qrwc.", pause: 300 },
    { kind: 'ok', text: '✔ Packages installed successfully.' },
    { kind: 'claude', text: 'Reading the qrwc README and type definitions…' },
    { kind: 'claude', text: 'Writing the connection service and panel UI.' },
    { kind: 'ok', text: 'Application bundle generation complete. [0.998 seconds]' },
    { kind: 'claude', text: 'Checking it in a real browser against a mock Core.' },
  ];

  protected readonly shipScript: TermLine[] = [
    { kind: 'prompt', text: 'commit a first commit' },
    { kind: 'claude', text: 'No access key or Core IP in the files. Committing:' },
    { kind: 'ok', text: '[main (root-commit) 63b9579] Initial Q-SYS touch panel workbench' },
    { kind: 'dim', text: '43 files changed, 9783 insertions(+)' },
    { kind: 'prompt', text: 'push it to github, can you create me a repo under my personal space?', pause: 700 },
    { kind: 'claude', text: 'Name is free. Creating it as private and pushing:' },
    { kind: 'dim', text: '$ gh repo create mikejobson/qsys-web-demo --private --source . --push' },
    { kind: 'ok', text: '✓ https://github.com/mikejobson/qsys-web-demo' },
  ];

  protected readonly pipeline = [
    { title: 'Scaffold', detail: 'Angular 22 app, zoneless, SCSS' },
    { title: 'Install', detail: '@q-sys/qrwc 1.0 from npm' },
    { title: 'Read the source', detail: 'README + type definitions. No guessing the API.' },
    { title: 'Build', detail: 'Connection service · panel frame · sidebar' },
    { title: 'Verify', detail: 'Headless browser + mock Core' },
  ];

  protected readonly loop = ['Write', 'Build', 'Run', 'Screenshot', 'Look', 'Fix'];

  protected readonly catches = [
    'Scaffold landed in the wrong folder, so it moved it',
    'Port 8081 already taken, so the mock Core moved to 18081',
    'Bezel shadow clipped into a box, so it fixed the CSS',
    'New styles missing, so it restarted the dev server',
  ];

  protected readonly components = [
    { name: 'MainGain', type: 'gain' },
    { name: 'Gain', type: 'gain' },
    { name: 'MainEQ', type: 'parametric eq' },
    { name: 'MainDelay', type: 'delay' },
    { name: 'MainLimiter', type: 'limiter' },
    { name: 'CamRouter', type: 'media router' },
    { name: 'Decoder', type: 'hdmi switcher' },
    { name: 'Cam-1', type: 'ptz camera' },
    { name: 'Cam-2', type: 'ptz camera' },
    { name: 'Cam-3', type: 'ptz camera' },
    { name: 'VideoBridge', type: 'usb bridge' },
  ];

  protected readonly code = [
    { t: 'c', s: '// any control on the Core, from any page' },
    { t: '', s: "volume = qsys.control('MainGain', 'gain');" },
    { t: '', s: "mute   = qsys.control('MainGain', 'mute');" },
    { t: '', s: '' },
    { t: '', s: 'volume.set({ Position: 0.7 });   ' },
    { t: 'c', s: '  // ↑ from a touch' },
    { t: '', s: 'volume.string();                 ' },
    { t: 'c', s: "  // → '-12.4dB'  live, via signals" },
  ];

  protected readonly rpcs = [
    { name: 'EngineStatus', dir: '←', note: 'Core pushes its state' },
    { name: 'Component.GetComponents', dir: '→', note: 'discover the design' },
    { name: 'ChangeGroup.Poll', dir: '⇄', note: 'every 150 ms' },
    { name: 'Component.Set', dir: '→', note: 'a touch on the panel' },
  ];

  constructor() {
    this.measure();
  }

  protected measure(): void {
    this.scale.set(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
  }

  protected go(i: number): void {
    const next = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (next === this.index()) return;
    this.direction.set(next > this.index() ? 1 : -1);
    this.index.set(next);
    this.router.navigate(['/present', next + 1], { replaceUrl: true });
  }

  protected next(): void {
    this.go(this.index() + 1);
  }

  protected prev(): void {
    this.go(this.index() - 1);
  }

  protected launchDemo(): void {
    this.router.navigate(['/']);
  }

  protected toggleFullscreen(): void {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => undefined);
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        this.next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
      case 'Backspace':
        this.prev();
        break;
      case 'Home':
        this.go(0);
        break;
      case 'End':
        this.go(SLIDES.length - 1);
        break;
      case 'Enter':
        if (this.index() === SLIDES.length - 1) this.launchDemo();
        else this.next();
        break;
      case 'f':
      case 'F':
        this.toggleFullscreen();
        break;
      case 'd':
      case 'D':
        this.launchDemo();
        break;
      default:
        return;
    }
    e.preventDefault();
  }
}
