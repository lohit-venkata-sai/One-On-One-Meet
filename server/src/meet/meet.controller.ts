import { Body, Controller, Post } from '@nestjs/common';
import { MeetService } from './meet.service';

@Controller('meet')
export class MeetController {
  constructor(private meetService: MeetService) {}
  @Post('create')
  createMeet() {
    console.log('reached to create route');
    return this.meetService.createMeet();
  }

  @Post('join')
  joinMeet(@Body() body: { meetId: string; identity: string }) {
    return this.meetService.joinMeet(body.meetId, body.identity);
  }
  @Post('leave')
  leaveMeet(@Body() body: { meetId: String }) {
    return this.meetService.leaveMeet(body.meetId);
  }
}
