import { ForbiddenException, Injectable } from "@nestjs/common";
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

  private normalizeAllowedUserIds(input?: string[]) {
    if (!Array.isArray(input)) {
      return [];
    }
    const normalized = input.filter(
      (value): value is string => typeof value === "string" && value.length > 0
    );
    return Array.from(new Set(normalized));
  }

  create(createMatchDto: CreateMatchDto, ownerId: string) {
    const payload = {
      ...createMatchDto,
      ownerId,
      allowedUserIds: this.normalizeAllowedUserIds(
        createMatchDto.allowedUserIds
      ),
    };
    return this.matchModel.create(payload);
  }

  findAll() {
    return this.matchModel.find().sort({ createdAt: -1 }).exec();
  }

  findOne(sessionId: string) {
    return this.matchModel.findOne({ sessionId }).exec();
  }

  async update(
    sessionId: string,
    updateMatchDto: UpdateMatchDto,
    userId: string
  ) {
    const match = await this.matchModel.findOne({ sessionId }).exec();
    if (!match) {
      return null;
    }
    const ownerId = match.ownerId ? String(match.ownerId) : null;
    const allowedUserIds = Array.isArray(match.allowedUserIds)
      ? match.allowedUserIds
      : [];
    const isOwner = !ownerId || ownerId === userId;
    const isAllowed = Boolean(ownerId) && allowedUserIds.includes(userId);
    if (!isOwner && !isAllowed) {
      throw new ForbiddenException("Only the match owner can edit this match.");
    }
    const {
      allowedUserIds: nextAllowedUserIds,
      ownerId: _ignoredOwnerId,
      ...rest
    } = updateMatchDto as UpdateMatchDto & { ownerId?: string };
    const payload: UpdateMatchDto & {
      ownerId?: string;
      allowedUserIds?: string[];
    } = { ...rest };
    if (!ownerId) {
      payload.ownerId = userId;
    }
    if (isOwner && Array.isArray(nextAllowedUserIds)) {
      payload.allowedUserIds = this.normalizeAllowedUserIds(
        nextAllowedUserIds
      );
    }
    return this.matchModel
      .findOneAndUpdate({ sessionId }, payload, { new: true })
      .exec();
  }

  async remove(sessionId: string, userId: string) {
    const match = await this.matchModel.findOne({ sessionId }).exec();
    if (!match) {
      return { deletedCount: 0 };
    }
    const ownerId = match.ownerId ? String(match.ownerId) : null;
    const allowedUserIds = Array.isArray(match.allowedUserIds)
      ? match.allowedUserIds
      : [];
    const isOwner = !ownerId || ownerId === userId;
    const isAllowed = Boolean(ownerId) && allowedUserIds.includes(userId);
    if (!isOwner && !isAllowed) {
      throw new ForbiddenException("Only the match owner can delete this match.");
    }
    return this.matchModel.deleteOne({ sessionId }).exec();
  }
}
