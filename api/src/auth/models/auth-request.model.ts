import type { Request } from "express";
import type { AuthUser } from "./auth-user.model";

export type AuthRequest = Request & { user: AuthUser };
