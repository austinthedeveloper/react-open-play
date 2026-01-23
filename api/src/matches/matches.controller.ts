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
import type { CreateMatchDto } from "./dto/create-match.dto";
import type { UpdateMatchDto } from "./dto/update-match.dto";
import { MatchesService } from "./matches.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthRequest } from "../auth/models/auth-request.model";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createMatchDto: CreateMatchDto, @Req() req: AuthRequest) {
    return this.matchesService.create(createMatchDto, String(req.user._id));
  }

  @Get()
  findAll() {
    return this.matchesService.findAll();
  }

  @Get(":sessionId")
  findOne(@Param("sessionId") sessionId: string) {
    return this.matchesService.findOne(sessionId);
  }

  @Patch(":sessionId")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("sessionId") sessionId: string,
    @Body() updateMatchDto: UpdateMatchDto,
    @Req() req: AuthRequest
  ) {
    return this.matchesService.update(
      sessionId,
      updateMatchDto,
      String(req.user._id)
    );
  }

  @Delete(":sessionId")
  @UseGuards(JwtAuthGuard)
  remove(@Param("sessionId") sessionId: string, @Req() req: AuthRequest) {
    return this.matchesService.remove(sessionId, String(req.user._id));
  }
}
