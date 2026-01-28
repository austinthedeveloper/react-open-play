import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "goalSessions" })
export class GoalSession extends Document {
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ required: true, default: () => Date.now() })
  createdAt: number;

  @Prop({ type: String, default: null, index: true })
  ownerId?: string | null;

  @Prop({ type: [String], default: [] })
  allowedUserIds: string[];

  @Prop({ required: true })
  numMatches: number;

  @Prop({ required: true })
  ratingRange: string;

  @Prop({ required: true })
  defaultOpponentLevel: string;

  @Prop({ type: [Object], default: [] })
  matches: {
    id: string;
    index: number;
    opponentLevel: string;
    goalText: string;
    played: boolean;
    result: string;
  }[];
}

export const GoalSessionSchema = SchemaFactory.createForClass(GoalSession);
