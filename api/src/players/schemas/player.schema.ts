import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "players" })
export class Player extends Document {
  @Prop({ required: true, unique: true, index: true })
  playerId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  color?: string | null;

  @Prop({ type: String, default: "" })
  gender?: string;

  @Prop({ required: true, default: () => Date.now() })
  createdAt: number;

  @Prop({ required: true, default: () => Date.now() })
  updatedAt: number;

  @Prop({ type: String, default: null, index: true })
  ownerId?: string | null;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
