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
import type { AuthRequest } from "../auth/models/auth-request.model";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { CreateGoalSessionDto } from "./dto/create-goal-session.dto";
import type { UpdateGoalSessionDto } from "./dto/update-goal-session.dto";
import { GoalSessionsService } from "./goal-sessions.service";

@Controller("goal-sessions")
export class GoalSessionsController {
  constructor(private readonly goalSessionsService: GoalSessionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createGoalSessionDto: CreateGoalSessionDto,
    @Req() req: AuthRequest
  ) {
    return this.goalSessionsService.create(
      createGoalSessionDto,
      String(req.user._id)
    );
  }

  @Get()
  findAll() {
    return this.goalSessionsService.findAll();
  }

  @Get(":sessionId")
  findOne(@Param("sessionId") sessionId: string) {
    return this.goalSessionsService.findOne(sessionId);
  }

  @Patch(":sessionId")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("sessionId") sessionId: string,
    @Body() updateGoalSessionDto: UpdateGoalSessionDto,
    @Req() req: AuthRequest
  ) {
    return this.goalSessionsService.update(
      sessionId,
      updateGoalSessionDto,
      String(req.user._id)
    );
  }

  @Delete(":sessionId")
  @UseGuards(JwtAuthGuard)
  remove(@Param("sessionId") sessionId: string, @Req() req: AuthRequest) {
    return this.goalSessionsService.remove(sessionId, String(req.user._id));
  }
}
