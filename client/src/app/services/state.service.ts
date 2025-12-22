import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  meetId = signal<string | null>(null);
  token = signal<string | null>(null);

  setMeetId(meetId: string) {
    this.meetId.set(meetId);
  }
  setToken(token: string) {
    this.token.set(token);
  }
}
