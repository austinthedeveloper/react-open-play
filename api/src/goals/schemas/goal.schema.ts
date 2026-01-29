import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "goals" })
export class Goal extends Document {
  @Prop({ required: true, unique: true, index: true })
  goalId: string;

  @Prop({ required: true })
  goalText: string;

  @Prop({ type: String, default: null })
  opponentLevel?: string | null;

  @Prop({ required: true, index: true })
  type: string;

  @Prop({ required: true, default: () => Date.now() })
  createdAt: number;

  @Prop({ required: true, default: () => Date.now() })
  updatedAt: number;

  @Prop({ type: String, default: null, index: true })
  createdById?: string | null;

  @Prop({ type: String, default: null })
  createdByName?: string | null;

  @Prop({ type: String, default: null })
  createdByPhotoUrl?: string | null;

  @Prop({ type: String, default: null })
  updatedById?: string | null;

  @Prop({ type: String, default: null })
  updatedByName?: string | null;

  @Prop({ type: String, default: null })
  updatedByPhotoUrl?: string | null;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
