import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor() {
    super({
      clientID:
        process.env.GOOGLE_CLIENT_ID ?? "placeholder-google-client-id",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ?? "placeholder-google-client-secret",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ??
        "http://localhost:3000/auth/google/callback",
      scope: ["profile", "email"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile
  ) {
    const email = profile.emails?.[0]?.value ?? null;
    return {
      googleId: profile.id,
      displayName: profile.displayName,
      email,
      photos: profile.photos?.map((photo) => photo.value) ?? [],
    };
  }
}
