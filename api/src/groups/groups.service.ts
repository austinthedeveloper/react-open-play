import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "node:crypto";
import type { Model } from "mongoose";
import type { CreateGroupDto } from "./dto/create-group.dto";
import type { UpdateGroupDto } from "./dto/update-group.dto";
import { Group } from "./schemas/group.schema";

@Injectable()
export class GroupsService {
  constructor(@InjectModel(Group.name) private readonly groupModel: Model<Group>) {}

  private normalizeName(name: string) {
    return name.trim();
  }

  private normalizePlayerIds(value?: string[]) {
    if (!Array.isArray(value)) {
      return [];
    }
    const normalized = value.filter(
      (entry): entry is string => typeof entry === "string" && entry.length > 0
    );
    return Array.from(new Set(normalized));
  }

  create(createGroupDto: CreateGroupDto, ownerId: string) {
    const now = Date.now();
    const groupId = createGroupDto.groupId?.trim() || randomUUID();
    const payload = {
      ...createGroupDto,
      groupId,
      name: this.normalizeName(createGroupDto.name),
      playerIds: this.normalizePlayerIds(createGroupDto.playerIds),
      createdAt: now,
      updatedAt: now,
      ownerId,
    };
    return this.groupModel.create(payload);
  }

  findAll(ownerId: string) {
    return this.groupModel.find({ ownerId }).sort({ createdAt: -1 }).exec();
  }

  async update(groupId: string, updateGroupDto: UpdateGroupDto, ownerId: string) {
    const group = await this.groupModel.findOne({ groupId }).exec();
    if (!group) {
      return null;
    }
    const storedOwnerId = group.ownerId ? String(group.ownerId) : null;
    if (!storedOwnerId || storedOwnerId !== ownerId) {
      throw new ForbiddenException("Only the group owner can edit this group.");
    }
    const payload: UpdateGroupDto & { updatedAt: number } = {
      ...updateGroupDto,
      updatedAt: Date.now(),
    };
    if (typeof updateGroupDto.name === "string") {
      payload.name = this.normalizeName(updateGroupDto.name);
    }
    if (Array.isArray(updateGroupDto.playerIds)) {
      payload.playerIds = this.normalizePlayerIds(updateGroupDto.playerIds);
    }
    return this.groupModel
      .findOneAndUpdate({ groupId }, payload, { new: true })
      .exec();
  }

  async remove(groupId: string, ownerId: string) {
    const group = await this.groupModel.findOne({ groupId }).exec();
    if (!group) {
      return { deletedCount: 0 };
    }
    const storedOwnerId = group.ownerId ? String(group.ownerId) : null;
    if (!storedOwnerId || storedOwnerId !== ownerId) {
      throw new ForbiddenException("Only the group owner can delete this group.");
    }
    return this.groupModel.deleteOne({ groupId }).exec();
  }
}
