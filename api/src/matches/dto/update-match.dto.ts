import type { CreateMatchDto } from "./create-match.dto";

export class UpdateMatchDto implements Partial<CreateMatchDto> {
  sessionId?: string;
  createdAt?: number;
  matchType?: string;
  players?: CreateMatchDto["players"];
  numMatches?: number;
  numCourts?: number;
  courtNumbers?: number[];
  schedule?: CreateMatchDto["schedule"];
  matchResults?: CreateMatchDto["matchResults"];
}
