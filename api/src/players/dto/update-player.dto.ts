import type { CreatePlayerDto } from "./create-player.dto";

export class UpdatePlayerDto implements Partial<CreatePlayerDto> {
  name?: string;
  color?: string;
  gender?: string;
}
