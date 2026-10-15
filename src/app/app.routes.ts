import { Routes } from '@angular/router';
import { WorkbenchPage } from './workbench/workbench-page';

export const routes: Routes = [
  { path: '', component: WorkbenchPage, title: 'Q-SYS Panel Workbench' },
  {
    path: 'present',
    loadComponent: () => import('./presentation/deck').then((m) => m.Deck),
    title: 'Built with Claude Code',
  },
  {
    path: 'present/:slide',
    loadComponent: () => import('./presentation/deck').then((m) => m.Deck),
    title: 'Built with Claude Code',
  },
  { path: '**', redirectTo: '' },
];
