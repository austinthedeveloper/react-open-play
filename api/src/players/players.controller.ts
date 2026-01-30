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
import type { CreatePlayerDto } from "./dto/create-player.dto";
import type { UpdatePlayerDto } from "./dto/update-player.dto";
import { PlayersService } from "./players.service";

@Controller("players")
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  create(@Body() createPlayerDto: CreatePlayerDto, @Req() req: AuthRequest) {
    return this.playersService.create(createPlayerDto, String(req.user._id));
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.playersService.findAll(String(req.user._id));
  }

  @Patch(":playerId")
  update(
    @Param("playerId") playerId: string,
    @Body() updatePlayerDto: UpdatePlayerDto,
    @Req() req: AuthRequest
  ) {
    return this.playersService.update(
      playerId,
      updatePlayerDto,
      String(req.user._id)
    );
  }

  @Delete(":playerId")
  remove(@Param("playerId") playerId: string, @Req() req: AuthRequest) {
    return this.playersService.remove(playerId, String(req.user._id));
  }
}
