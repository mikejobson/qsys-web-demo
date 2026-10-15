import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { QsysService } from '../core/qsys.service';

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}(:\d{1,5})?$/;
const HOSTNAME = /^[a-z0-9]([a-z0-9-.]*[a-z0-9])?(:\d{1,5})?$/i;

@Component({
  selector: 'app-connection-panel',
  imports: [DatePipe],
  templateUrl: './connection-panel.html',
  styleUrl: './connection-panel.scss',
})
export class ConnectionPanel {
  protected readonly qsys = inject(QsysService);

  protected readonly host = signal(this.qsys.settings().host);
  protected readonly secure = signal(this.qsys.settings().secure);
  protected readonly apiKey = signal(this.qsys.settings().apiKey);
  protected readonly pollingInterval = signal(this.qsys.settings().pollingInterval);
  protected readonly componentFilter = signal('');

  protected readonly hostValid = computed(() => {
    const h = this.host().trim();
    return IPV4.test(h) || HOSTNAME.test(h);
  });

  // Browsers block ws:// from an https:// page.
  protected readonly mixedContent = computed(() => location.protocol === 'https:' && !this.secure());

  protected readonly filteredComponents = computed(() => {
    const q = this.componentFilter().trim().toLowerCase();
    const all = this.qsys.components();
    return q ? all.filter((c) => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)) : all;
  });

  protected connect(): void {
    if (!this.hostValid() || this.qsys.isBusy()) return;
    this.qsys.connect({
      host: this.host(),
      secure: this.secure(),
      apiKey: this.apiKey(),
      pollingInterval: Math.max(34, this.pollingInterval() || 150),
    });
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
