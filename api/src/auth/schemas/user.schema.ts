import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "users" })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  googleId!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true })
  photoUrl!: string;

  @Prop({ type: String, default: null })
  refreshToken?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
