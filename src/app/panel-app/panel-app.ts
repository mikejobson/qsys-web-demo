import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { QsysService } from '../core/qsys.service';
import { HomePage } from './pages/home-page';
import { AudioPage } from './pages/audio-page';
import { VideoPage } from './pages/video-page';
import { CameraPage } from './pages/camera-page';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

/**
 * The touch panel UI itself — everything rendered on the 1280×800 screen.
 */
@Component({
  selector: 'app-panel-app',
  imports: [DatePipe, HomePage, AudioPage, VideoPage, CameraPage],
  templateUrl: './panel-app.html',
  styleUrl: './panel-app.scss',
})
export class PanelApp {
  protected readonly qsys = inject(QsysService);

  protected readonly now = signal(new Date());
  protected readonly activePage = signal('home');

  protected readonly nav: NavItem[] = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'audio', label: 'Audio', icon: '♪' },
    { id: 'video', label: 'Video', icon: '▶' },
    { id: 'camera', label: 'Camera', icon: '◉' },
  ];

  protected readonly statusLabel = computed(() => {
    switch (this.qsys.state()) {
      case 'connected':
        return 'Online';
      case 'connecting':
        return 'Connecting';
      case 'reconnecting':
        return 'Reconnecting';
      case 'failed':
        return 'Offline';
      default:
        return 'No Core';
    }
  });

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
