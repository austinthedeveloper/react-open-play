import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { User } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOrCreate(profile: any): Promise<User> {
    let user = await this.userModel.findOne({ googleId: profile.id }).exec();

    if (!user) {
      user = new this.userModel({
        googleId: profile.id,
        email: profile.emails?.[0]?.value ?? "",
        displayName: profile.displayName ?? "",
        photoUrl: profile.photos?.[0]?.value ?? "",
      });
      await user.save();
    }

    return user;
  }

  async findById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId).exec();
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshToken: null })
      .exec();
  }
}
