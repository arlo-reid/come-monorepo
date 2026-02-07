import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto } from './dto';
import { JwtAuthGuard } from '../auth/auth.guard';

interface RequestWithUser extends Request {
  user: { id: string; phone: string };
}

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() dto: CreateGroupDto, @Request() req: RequestWithUser) {
    return this.groupsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.groupsService.findAllForUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.groupsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
    @Request() req: RequestWithUser,
  ) {
    return this.groupsService.update(id, dto, req.user.id);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @Request() req: RequestWithUser,
  ) {
    return this.groupsService.addMember(id, dto, req.user.id);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.groupsService.removeMember(id, userId, req.user.id);
  }
}
