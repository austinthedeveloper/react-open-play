import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { JwtService } from "@nestjs/jwt";
import type { Response } from "express";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AuthRequest } from "./models/auth-request.model";

@Controller("auth")
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleLogin() {
    return { message: "Redirecting to Google..." };
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: AuthRequest, @Res() res: Response) {
    const user = req.user;
    const payload = { sub: user._id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: "10h" });
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: AuthRequest) {
    return req.user;
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: AuthRequest) {
    await this.usersService.clearRefreshToken(req.user._id);
    return { message: "Logged out successfully" };
  }
}
