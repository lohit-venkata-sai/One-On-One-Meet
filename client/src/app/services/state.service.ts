import { Injectable, signal } from '@angular/core';
import { ChatMsg } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  constructor() {}
  meetId = signal<string | null>(null);
  token = signal<string | null>(null);

  speakerId?: string | null;
  micId?: string | null;
  cameraId?: string | null;

  chatMessages = signal<ChatMsg[]>([]);

  setMeetId(meetId: string) {
    this.meetId.set(meetId);
  }
  setToken(token: string) {
    this.token.set(token);
  }
  setDevices(devices: { speakerId: string | null; micId: string | null; cameraId: string | null }) {
    this.speakerId = devices.speakerId;
    this.micId = devices.micId;
    this.cameraId = devices.cameraId;
  }

  getDevices() {
    return {
      speakerId: this.speakerId,
      micId: this.micId,
      cameraId: this.cameraId,
    };
  }
  addChatMsg(message: ChatMsg) {
    console.log('message added', message);
    this.chatMessages.update((msgs) => [...msgs, message]);
    console.log('why this doest works', this.chatMessages());
  }
  clearChat() {
    this.chatMessages.set([]);
  }
}
