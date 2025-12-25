import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'socket.io';
import { SocketService } from './socket/socket.service';
import * as http from 'http';
import { rootCertificates } from 'tls';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });

  const server = app.getHttpServer();

  const io = new Server(server, {
    cors: { origin: '*' },
  });

  const socketService = app.get(SocketService);

  io.on('connection', (socket) => {
    console.log('user connected:', socket.id);
    socket.on('join:room', (room) => {
      io.to(room).emit('new:user', socket.id);
      socket.join(room);
      console.log(`socket ${socket.id} joined room ${room}`);
      socket.emit('join:room', room);
    });
    socket.on('new:message', (message) => {
      console.log('new message comes here', message.message);
      console.error('room id is ', message.room);
      socket.to(message.room).emit('new:message', message);
    });
    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id);
    });
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
