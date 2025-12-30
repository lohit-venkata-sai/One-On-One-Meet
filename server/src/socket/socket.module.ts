import { Module } from '@nestjs/common';
import { SocketService } from '../socket/socket.service';
import { SocketGateway } from './socket.gateway';

@Module({
  providers: [SocketService, SocketGateway],
  exports: [SocketService, SocketGateway],
})
export class SocketModule {}
