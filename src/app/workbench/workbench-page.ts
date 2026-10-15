import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QsysLogo } from '../shared/qsys-logo';
import { QsysService } from '../core/qsys.service';
import { Orientation, TouchPanelFrame } from '../touch-panel/touch-panel-frame';
import { PanelApp } from '../panel-app/panel-app';
import { ConnectionPanel } from './connection-panel';

@Component({
  selector: 'app-workbench-page',
  imports: [RouterLink, QsysLogo, TouchPanelFrame, PanelApp, ConnectionPanel],
  templateUrl: './workbench-page.html',
  styleUrl: './workbench-page.scss',
})
export class WorkbenchPage {
  private readonly qsys = inject(QsysService);
  private readonly frame = viewChild(TouchPanelFrame);

  protected readonly orientation = signal<Orientation>('landscape');
  protected readonly scalePercent = computed(() => Math.round((this.frame()?.scale() ?? 0) * 100));

  protected readonly ledColor = computed(() => {
    switch (this.qsys.state()) {
      case 'connected':
        return 'green';
      case 'connecting':
      case 'reconnecting':
        return 'amber';
      case 'failed':
        return 'red';
      default:
        return 'off';
    }
  });
}
