import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthController } from "./auth.controller";
import { GoogleStrategy } from "./google.strategy";
import { JwtStrategy } from "./jwt.strategy";
import { UsersService } from "./users.service";
import { User, UserSchema } from "./schemas/user.schema";

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") ?? "dev-secret",
        signOptions: { expiresIn: "10h" },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [GoogleStrategy, JwtStrategy, UsersService],
})
export class AuthModule {}
