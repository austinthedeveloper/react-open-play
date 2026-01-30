import type { GenderOption, Player } from "../interfaces";
import { authService } from "./authService";

export type PlayerApi = {
  playerId: string;
  name: string;
  color?: string;
  gender?: string;
  createdAt?: number;
  updatedAt?: number;
  ownerId?: string | null;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

const requireApiBaseUrl = () => {
  if (!apiBaseUrl) {
    throw new Error("Missing VITE_API_BASE_URL");
  }
  return apiBaseUrl;
};

const request = async <T>(path: string, options: RequestInit = {}) => {
  const baseUrl = requireApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authService.getAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || response.statusText);
  }

  return text ? (JSON.parse(text) as T) : (null as T);
};

const fromApiPlayer = (player: PlayerApi): Player => ({
  id: player.playerId,
  name: player.name,
  color: player.color,
  gender: (player.gender ?? "") as GenderOption,
  createdAt: player.createdAt,
  updatedAt: player.updatedAt,
});

const toApiPlayer = (player: Partial<Player>): Partial<PlayerApi> => ({
  playerId: player.id,
  name: player.name,
  color: player.color,
  gender: player.gender,
});

export const playersService = {
  async list() {
    const players = await request<PlayerApi[]>("/players");
    return players.map(fromApiPlayer);
  },
  async create(player: Omit<Player, "id"> & { id?: string }) {
    const created = await request<PlayerApi>("/players", {
      method: "POST",
      body: JSON.stringify(toApiPlayer(player)),
    });
    return fromApiPlayer(created);
  },
  async update(playerId: string, patch: Partial<Player>) {
    const updated = await request<PlayerApi>(`/players/${playerId}`, {
      method: "PATCH",
      body: JSON.stringify(toApiPlayer(patch)),
    });
    return fromApiPlayer(updated);
  },
  remove(playerId: string) {
    return request<{ deletedCount?: number }>(`/players/${playerId}`, {
      method: "DELETE",
    });
  },
};
