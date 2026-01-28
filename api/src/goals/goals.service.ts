import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "node:crypto";
import type { Model } from "mongoose";
import type { AuthUser } from "../auth/models/auth-user.model";
import type { CreateGoalDto } from "./dto/create-goal.dto";
import type { UpdateGoalDto } from "./dto/update-goal.dto";
import { Goal } from "./schemas/goal.schema";

@Injectable()
export class GoalsService {
  constructor(@InjectModel(Goal.name) private readonly goalModel: Model<Goal>) {}

  createUserGoal(createGoalDto: CreateGoalDto, user: AuthUser) {
    const now = Date.now();
    const goalId = createGoalDto.goalId?.trim() || randomUUID();
    const payload = {
      ...createGoalDto,
      goalId,
      type: "user",
      createdAt: now,
      updatedAt: now,
      createdById: String(user._id),
      createdByName: user.displayName,
      createdByPhotoUrl: user.photoUrl,
      updatedById: String(user._id),
      updatedByName: user.displayName,
      updatedByPhotoUrl: user.photoUrl,
    };
    return this.goalModel.create(payload);
  }

  createGlobalGoal(createGoalDto: CreateGoalDto, user: AuthUser) {
    const now = Date.now();
    const goalId = createGoalDto.goalId?.trim() || randomUUID();
    const payload = {
      ...createGoalDto,
      goalId,
      type: "global",
      createdAt: now,
      updatedAt: now,
      createdById: String(user._id),
      createdByName: user.displayName,
      createdByPhotoUrl: user.photoUrl,
      updatedById: String(user._id),
      updatedByName: user.displayName,
      updatedByPhotoUrl: user.photoUrl,
    };
    return this.goalModel.create(payload);
  }

  findGlobalGoals() {
    return this.goalModel.find({ type: "global" }).sort({ createdAt: -1 }).exec();
  }

  findUserGoals(createdById: string) {
    return this.goalModel
      .find({ type: "user", createdById })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateUserGoal(goalId: string, patch: UpdateGoalDto, user: AuthUser) {
    const goal = await this.goalModel.findOne({ goalId, type: "user" }).exec();
    if (!goal) {
      return null;
    }
    const createdById = goal.createdById ? String(goal.createdById) : null;
    if (!createdById || createdById !== String(user._id)) {
      throw new ForbiddenException("Only the goal owner can edit this goal.");
    }
    const payload = {
      ...patch,
      updatedAt: Date.now(),
      updatedById: String(user._id),
      updatedByName: user.displayName,
      updatedByPhotoUrl: user.photoUrl,
    };
    return this.goalModel
      .findOneAndUpdate({ goalId, type: "user" }, payload, { new: true })
      .exec();
  }

  async removeUserGoal(goalId: string, user: AuthUser) {
    const goal = await this.goalModel.findOne({ goalId, type: "user" }).exec();
    if (!goal) {
      return { deletedCount: 0 };
    }
    const createdById = goal.createdById ? String(goal.createdById) : null;
    if (!createdById || createdById !== String(user._id)) {
      throw new ForbiddenException("Only the goal owner can delete this goal.");
    }
    return this.goalModel.deleteOne({ goalId, type: "user" }).exec();
  }
}
