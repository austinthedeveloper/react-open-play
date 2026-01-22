import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "./users.service";
import type { AuthUser } from "./models/auth-user.model";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService
  ) {
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID"),
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL:
        configService.get<string>("GOOGLE_CALLBACK_URL") ??
        "http://localhost:3000/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<void> {
    const user = await this.usersService.findOrCreate(profile);
    const authUser: AuthUser = {
      _id: user._id.toString(),
      googleId: user.googleId,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl,
    };
    done(null, authUser);
  }
}
