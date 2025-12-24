import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SocketService {
  private clients = new Map<string, Socket>();

  addClient(userId: string, socket: Socket) {
    this.clients.set(userId, socket);
  }

  removeBySocketId(socketId: string) {
    for (const [userId, socket] of this.clients.entries()) {
      if (socket.id === socketId) {
        this.clients.delete(userId);
        break;
      }
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    const socket = this.clients.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  emitToAll(event: string, data: any) {
    for (const socket of this.clients.values()) {
      socket.emit(event, data);
    }
  }
}
