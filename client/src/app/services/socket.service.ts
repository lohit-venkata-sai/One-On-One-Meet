import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { StateService } from './state.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  socket: Socket;

  constructor(private stateService: StateService) {
    this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
      console.log('Connected:', this.socket.id);
    });
    this.socket.on('join:room', (data) => {
      console.log('message: roomId', data);
    });
    this.socket.on('new:message', (message) => {
      console.log('new message emited ', message);
      if (message.socketId == this.socket.id) {
        return;
      }
      this.stateService.addChatMsg(message);
    });
  }
  // joinSocketRoom(room: any) {
  //   this.
  // }
}

export type ChatMsg = {
  socketId: string | undefined;
  message: string;
  room: string | null;
};
