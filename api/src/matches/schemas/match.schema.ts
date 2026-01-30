import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema({ collection: "matches" })
export class Match extends Document {
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ required: true, default: () => Date.now() })
  createdAt: number;

  @Prop({ type: String, default: null, index: true })
  ownerId?: string | null;

  @Prop({ type: [String], default: [] })
  allowedUserIds: string[];

  @Prop({ required: true })
  matchType: string;

  @Prop({ type: [Object], default: [] })
  players: {
    id: string;
    playerId?: string;
    name: string;
    color?: string;
    gender?: string;
  }[];

  @Prop({ required: true })
  numMatches: number;

  @Prop({ required: true })
  numCourts: number;

  @Prop({ type: [Number], default: [] })
  courtNumbers: number[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  schedule: {
    matches: {
      id: string;
      index: number;
      teams: [string[], string[]];
    }[];
  } | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  matchResults: Record<string, string>;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
