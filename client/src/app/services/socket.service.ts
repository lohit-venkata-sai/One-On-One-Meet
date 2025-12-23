import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environment';
import { StateService } from './state.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  socket: Socket;

  constructor(private stateService: StateService) {
    console.log('socket is called');
    this.socket = io(environment.socketIoUrl);
    this.socket.on('new:message', (msg: ChatMsg) => {
      this.stateService.addChatMsg(msg);
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });
  }
  connect() {
    this.socket = io(environment.socketIoUrl);

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });
  }
}
export type ChatMsg = {
  socketId: string | undefined;
  message: string;
  room: string | null;
};
