import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MeetController } from './meet/meet.controller';
import { MeetService } from './meet/meet.service';
import { MeetModule } from './meet/meet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MeetModule,
  ],
  controllers: [AppController, MeetController],
  providers: [AppService, MeetService],
})
export class AppModule {}
