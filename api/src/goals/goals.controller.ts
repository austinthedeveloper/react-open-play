import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Delete,
} from "@nestjs/common";
import type { AuthRequest } from "../auth/models/auth-request.model";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { CreateGoalDto } from "./dto/create-goal.dto";
import { GoalsService } from "./goals.service";
import type { UpdateGoalDto } from "./dto/update-goal.dto";

@Controller("goals")
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  private getAdminEmails(): string[] {
    const raw = process.env.GOALS_ADMIN_EMAILS ?? "";
    return raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);
  }

  private ensureAdmin(req: AuthRequest) {
    const emails = this.getAdminEmails();
    const email = req.user.email?.toLowerCase?.() ?? "";
    if (!email || emails.length === 0 || !emails.includes(email)) {
      throw new ForbiddenException("Admin access required.");
    }
  }

  @Get("global")
  findGlobalGoals() {
    return this.goalsService.findGlobalGoals();
  }

  @Post("global")
  @UseGuards(JwtAuthGuard)
  createGlobalGoal(@Body() createGoalDto: CreateGoalDto, @Req() req: AuthRequest) {
    this.ensureAdmin(req);
    return this.goalsService.createGlobalGoal(createGoalDto, req.user);
  }

  @Get("user/:createdById")
  @UseGuards(JwtAuthGuard)
  findUserGoals(
    @Param("createdById") createdById: string,
    @Req() req: AuthRequest
  ) {
    if (String(req.user._id) !== createdById) {
      throw new ForbiddenException("You can only view your own goals.");
    }
    return this.goalsService.findUserGoals(createdById);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createGoalDto: CreateGoalDto, @Req() req: AuthRequest) {
    return this.goalsService.createUserGoal(createGoalDto, req.user);
  }

  @Patch(":goalId")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("goalId") goalId: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @Req() req: AuthRequest
  ) {
    return this.goalsService.updateUserGoal(goalId, updateGoalDto, req.user);
  }

  @Delete(":goalId")
  @UseGuards(JwtAuthGuard)
  remove(@Param("goalId") goalId: string, @Req() req: AuthRequest) {
    return this.goalsService.removeUserGoal(goalId, req.user);
  }
}
