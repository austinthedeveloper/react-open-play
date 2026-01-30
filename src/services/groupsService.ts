import type { PlayerGroup } from "../interfaces";
import { authService } from "./authService";

export type GroupApi = {
  groupId: string;
  name: string;
  playerIds: string[];
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

const normalizeArray = <T,>(value: T[] | null | undefined) =>
  Array.isArray(value) ? value : [];

const fromApiGroup = (group: GroupApi): PlayerGroup => ({
  id: group.groupId,
  name: group.name,
  playerIds: normalizeArray(group.playerIds),
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
});

const toApiGroup = (group: Partial<PlayerGroup>): Partial<GroupApi> => ({
  groupId: group.id,
  name: group.name,
  playerIds: group.playerIds,
});

export const groupsService = {
  async list() {
    const groups = await request<GroupApi[]>("/groups");
    return groups.map(fromApiGroup);
  },
  async create(group: Omit<PlayerGroup, "id"> & { id?: string }) {
    const created = await request<GroupApi>("/groups", {
      method: "POST",
      body: JSON.stringify(toApiGroup(group)),
    });
    return fromApiGroup(created);
  },
  async update(groupId: string, patch: Partial<PlayerGroup>) {
    const updated = await request<GroupApi>(`/groups/${groupId}`, {
      method: "PATCH",
      body: JSON.stringify(toApiGroup(patch)),
    });
    return fromApiGroup(updated);
  },
  remove(groupId: string) {
    return request<{ deletedCount?: number }>(`/groups/${groupId}`, {
      method: "DELETE",
    });
  },
};
