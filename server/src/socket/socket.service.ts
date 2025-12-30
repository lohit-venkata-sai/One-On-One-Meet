import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class SocketService {
  handleConnection(socket: Socket, server: Server) {
    console.log('client connected:', socket.id);

    socket.on('join:room', (room: string) => {
      socket.join(room);

      console.log(`socket ${socket.id} joined room ${room}`);

      socket.to(room).emit('new:user', socket.id);

      socket.emit('join:room', room);
    });

    socket.on('new:message', (payload) => {
      console.log('message:', payload.message);
      console.log('room:', payload.room);

      server.to(payload.room).emit('new:message', payload);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id);
    });
  }
}
