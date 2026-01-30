import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "node:crypto";
import type { Model } from "mongoose";
import type { CreatePlayerDto } from "./dto/create-player.dto";
import type { UpdatePlayerDto } from "./dto/update-player.dto";
import { Player } from "./schemas/player.schema";

@Injectable()
export class PlayersService {
  constructor(
    @InjectModel(Player.name) private readonly playerModel: Model<Player>
  ) {}

  private normalizeName(name: string) {
    return name.trim();
  }

  private normalizeGender(value?: string) {
    return typeof value === "string" ? value.trim() : "";
  }

  async create(createPlayerDto: CreatePlayerDto, ownerId: string) {
    const now = Date.now();
    const playerId = createPlayerDto.playerId?.trim() || randomUUID();
    const payload = {
      ...createPlayerDto,
      playerId,
      name: this.normalizeName(createPlayerDto.name),
      gender: this.normalizeGender(createPlayerDto.gender),
      createdAt: now,
      updatedAt: now,
      ownerId,
    };
    return this.playerModel.create(payload);
  }

  findAll(ownerId: string) {
    return this.playerModel.find({ ownerId }).sort({ createdAt: -1 }).exec();
  }

  async update(
    playerId: string,
    updatePlayerDto: UpdatePlayerDto,
    ownerId: string
  ) {
    const player = await this.playerModel.findOne({ playerId }).exec();
    if (!player) {
      return null;
    }
    const storedOwnerId = player.ownerId ? String(player.ownerId) : null;
    if (!storedOwnerId || storedOwnerId !== ownerId) {
      throw new ForbiddenException("Only the player owner can edit this player.");
    }
    const payload: UpdatePlayerDto & { updatedAt: number } = {
      ...updatePlayerDto,
      updatedAt: Date.now(),
    };
    if (typeof updatePlayerDto.name === "string") {
      payload.name = this.normalizeName(updatePlayerDto.name);
    }
    if (typeof updatePlayerDto.gender === "string") {
      payload.gender = this.normalizeGender(updatePlayerDto.gender);
    }
    return this.playerModel
      .findOneAndUpdate({ playerId }, payload, { new: true })
      .exec();
  }

  async remove(playerId: string, ownerId: string) {
    const player = await this.playerModel.findOne({ playerId }).exec();
    if (!player) {
      return { deletedCount: 0 };
    }
    const storedOwnerId = player.ownerId ? String(player.ownerId) : null;
    if (!storedOwnerId || storedOwnerId !== ownerId) {
      throw new ForbiddenException("Only the player owner can delete this player.");
    }
    return this.playerModel.deleteOne({ playerId }).exec();
  }
}
