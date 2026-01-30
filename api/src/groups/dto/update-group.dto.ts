import type { CreateGroupDto } from "./create-group.dto";

export class UpdateGroupDto implements Partial<CreateGroupDto> {
  name?: string;
  playerIds?: string[];
}
