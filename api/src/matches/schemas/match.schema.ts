import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from "mongoose";
import type { Document } from "mongoose";

export type MatchDocument = Match & Document;

@Schema({ collection: "matches" })
export class Match {
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ required: true, default: () => Date.now() })
  createdAt: number;

  @Prop({ required: true })
  matchType: string;

  @Prop({ type: [Object], default: [] })
  players: {
    id: string;
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
