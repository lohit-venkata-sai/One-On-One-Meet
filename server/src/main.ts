import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'socket.io';
import { SocketService } from './socket/socket.service';
import * as http from 'http';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });

  const server = http.createServer(app.getHttpAdapter().getInstance());

  const io = new Server(server, {
    cors: { origin: '*' },
  });

  const socketService = app.get(SocketService);

  io.on('connection', (socket) => {
    console.log('user connected:', socket.id);
    socket.on('join:room', (room) => {
      console.log(`socket ${socket.id} joined room ${room}`);
      socket.emit('join:room', room);
    });
    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id);
    });
  });

  server.listen(process.env.PORT ?? 3000, () => {
    console.log('server is running ');
  });
}
bootstrap();
