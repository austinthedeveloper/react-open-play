import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthRequest } from "../auth/models/auth-request.model";
import type { CreateGroupDto } from "./dto/create-group.dto";
import type { UpdateGroupDto } from "./dto/update-group.dto";
import { GroupsService } from "./groups.service";

@Controller("groups")
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() createGroupDto: CreateGroupDto, @Req() req: AuthRequest) {
    return this.groupsService.create(createGroupDto, String(req.user._id));
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.groupsService.findAll(String(req.user._id));
  }

  @Patch(":groupId")
  update(
    @Param("groupId") groupId: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Req() req: AuthRequest
  ) {
    return this.groupsService.update(
      groupId,
      updateGroupDto,
      String(req.user._id)
    );
  }

  @Delete(":groupId")
  remove(@Param("groupId") groupId: string, @Req() req: AuthRequest) {
    return this.groupsService.remove(groupId, String(req.user._id));
  }
}
