import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MeetController } from './meet/meet.controller';
import { MeetService } from './meet/meet.service';
import { MeetModule } from './meet/meet.module';
import { SocketModule } from './socket/socket.module';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MeetModule,
    SocketModule,
  ],
  controllers: [AppController, MeetController],
  providers: [AppService, MeetService, ChatGateway],
})
export class AppModule {}
