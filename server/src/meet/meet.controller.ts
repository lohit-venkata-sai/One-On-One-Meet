import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { MeetService } from './meet.service';

@Controller('meet')
export class MeetController {
  constructor(private meetService: MeetService) {}
  @Post('create')
  createMeet() {
    // console.log('reached to create route');
    return this.meetService.createMeet();
  }

  @Post('join')
  joinMeet(@Body() body: { meetId: string; identity: string }) {
    console.log('join meet reaching');
    return this.meetService.joinMeet(body.meetId, body.identity);
  }
  @Post('leave')
  leaveMeet(@Body() body: { meetId: string; identity: string }) {
    return this.meetService.leaveMeet(body.meetId, body.identity);
  }
  @Get('isvalid/:meetId')
  isValidMeetId(@Param('meetId') meetId: string) {
    return this.meetService.isValidMeetId(meetId);
  }
}
