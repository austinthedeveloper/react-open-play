import type { GenderOption } from "./matchBuilder";

export type Player = {
  id: string;
  name: string;
  color?: string;
  gender?: GenderOption;
  createdAt?: number;
  updatedAt?: number;
};
