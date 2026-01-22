import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import type { CreateMatchDto } from "./dto/create-match.dto";
import type { UpdateMatchDto } from "./dto/update-match.dto";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
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
  update(
    @Param("sessionId") sessionId: string,
    @Body() updateMatchDto: UpdateMatchDto
  ) {
    return this.matchesService.update(sessionId, updateMatchDto);
  }

  @Delete(":sessionId")
  remove(@Param("sessionId") sessionId: string) {
    return this.matchesService.remove(sessionId);
  }
}
