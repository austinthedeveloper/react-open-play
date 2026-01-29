import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { CreateGoalSessionDto } from "./dto/create-goal-session.dto";
import type { UpdateGoalSessionDto } from "./dto/update-goal-session.dto";
import { GoalSession } from "./schemas/goal-session.schema";

@Injectable()
export class GoalSessionsService {
  constructor(
    @InjectModel(GoalSession.name)
    private readonly goalSessionModel: Model<GoalSession>
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

  create(createGoalSessionDto: CreateGoalSessionDto, ownerId: string) {
    const payload = {
      ...createGoalSessionDto,
      ownerId,
      allowedUserIds: this.normalizeAllowedUserIds(
        createGoalSessionDto.allowedUserIds
      ),
    };
    return this.goalSessionModel.create(payload);
  }

  findAll() {
    return this.goalSessionModel.find().sort({ createdAt: -1 }).exec();
  }

  findOne(sessionId: string) {
    return this.goalSessionModel.findOne({ sessionId }).exec();
  }

  async update(
    sessionId: string,
    updateGoalSessionDto: UpdateGoalSessionDto,
    userId: string
  ) {
    const session = await this.goalSessionModel
      .findOne({ sessionId })
      .exec();
    if (!session) {
      return null;
    }
    const ownerId = session.ownerId ? String(session.ownerId) : null;
    const allowedUserIds = Array.isArray(session.allowedUserIds)
      ? session.allowedUserIds
      : [];
    const isOwner = !ownerId || ownerId === userId;
    const isAllowed = Boolean(ownerId) && allowedUserIds.includes(userId);
    if (!isOwner && !isAllowed) {
      throw new ForbiddenException(
        "Only the goal session owner can edit this session."
      );
    }
    const {
      allowedUserIds: nextAllowedUserIds,
      ownerId: _ignoredOwnerId,
      ...rest
    } = updateGoalSessionDto as UpdateGoalSessionDto & { ownerId?: string };
    const payload: UpdateGoalSessionDto & {
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
    return this.goalSessionModel
      .findOneAndUpdate({ sessionId }, payload, { new: true })
      .exec();
  }

  async remove(sessionId: string, userId: string) {
    const session = await this.goalSessionModel
      .findOne({ sessionId })
      .exec();
    if (!session) {
      return { deletedCount: 0 };
    }
    const ownerId = session.ownerId ? String(session.ownerId) : null;
    const allowedUserIds = Array.isArray(session.allowedUserIds)
      ? session.allowedUserIds
      : [];
    const isOwner = !ownerId || ownerId === userId;
    const isAllowed = Boolean(ownerId) && allowedUserIds.includes(userId);
    if (!isOwner && !isAllowed) {
      throw new ForbiddenException(
        "Only the goal session owner can delete this session."
      );
    }
    return this.goalSessionModel.deleteOne({ sessionId }).exec();
  }
}
