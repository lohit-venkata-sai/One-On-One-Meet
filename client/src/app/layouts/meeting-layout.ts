import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'meeting-layout',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class MeetingLayout {}
