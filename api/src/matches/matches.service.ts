import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { CreateMatchDto } from "./dto/create-match.dto";
import type { UpdateMatchDto } from "./dto/update-match.dto";
import { Match } from "./schemas/match.schema";

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(Match.name) private readonly matchModel: Model<Match>
  ) {}

  create(createMatchDto: CreateMatchDto) {
    return this.matchModel.create(createMatchDto);
  }

  findAll() {
    return this.matchModel.find().sort({ createdAt: -1 }).exec();
  }

  findOne(sessionId: string) {
    return this.matchModel.findOne({ sessionId }).exec();
  }

  update(sessionId: string, updateMatchDto: UpdateMatchDto) {
    return this.matchModel
      .findOneAndUpdate({ sessionId }, updateMatchDto, { new: true })
      .exec();
  }

  remove(sessionId: string) {
    return this.matchModel.deleteOne({ sessionId }).exec();
  }
}
