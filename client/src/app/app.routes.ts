import { Routes } from '@angular/router';
import { Lobby } from './lobby/lobby';
import { Precheck } from './precheck/precheck';
import { Meeting } from './meeting/meeting';
import { Notfound } from './notfound/notfound';
import { AppLayout } from './layouts/app-layout';
import { MeetingLayout } from './layouts/meeting-layout';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: '', redirectTo: 'lobby', pathMatch: 'full' },
      { path: 'lobby', component: Lobby },
      { path: 'lobby/:meetId', component: Lobby },
      { path: 'precheck', component: Precheck },
    ],
  },
  {
    path: 'meeting',
    component: MeetingLayout,
    children: [{ path: '', component: Meeting }],
  },
  {
    path: '**',
    component: Notfound,
  },
];
