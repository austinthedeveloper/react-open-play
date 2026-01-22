import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Controller("auth")
export class AuthController {
  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin() {
    return;
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  googleCallback(@Req() req: { user?: unknown }) {
    return req.user;
  }
}
