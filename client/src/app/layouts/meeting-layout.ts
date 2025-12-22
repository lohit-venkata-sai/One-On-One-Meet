import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'meeting-layout',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  host: {
    class: 'block min-h-screen flex flex-col text-white ',
  },
})
export class MeetingLayout {}
