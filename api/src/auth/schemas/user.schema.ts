import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema({ collection: "users" })
export class User {
  @Prop({ required: true, unique: true, index: true })
  googleId!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true })
  photoUrl!: string;

  @Prop()
  refreshToken?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
