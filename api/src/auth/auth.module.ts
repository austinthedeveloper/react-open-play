import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { GoogleStrategy } from "./google.strategy";

@Module({
  imports: [PassportModule.register({ session: false })],
  controllers: [AuthController],
  providers: [GoogleStrategy],
})
export class AuthModule {}
