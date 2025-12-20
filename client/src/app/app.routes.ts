import { Routes } from '@angular/router';
import { Lobby } from './lobby/lobby';
import { Precheck } from './precheck/precheck';
import { Meeting } from './meeting/meeting';

export const routes: Routes = [
    {
        path: '', component: Lobby
    },
    {
        path: 'precheck', component: Precheck
    },
    {
        path: 'meeting', component: Meeting
    },
];
