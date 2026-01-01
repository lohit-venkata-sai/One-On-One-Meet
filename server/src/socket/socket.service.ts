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

    socket.on('new:message', (data) => {
      console.log('message:', data.message);
      console.log('room:', data.room);

      server.to(data.room).emit('new:message', data);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id);
    });
  }
}
