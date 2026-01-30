import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "groups" })
export class Group extends Document {
  @Prop({ required: true, unique: true, index: true })
  groupId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], default: [] })
  playerIds: string[];

  @Prop({ required: true, default: () => Date.now() })
  createdAt: number;

  @Prop({ required: true, default: () => Date.now() })
  updatedAt: number;

  @Prop({ type: String, default: null, index: true })
  ownerId?: string | null;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
