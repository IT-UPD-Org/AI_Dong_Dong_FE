import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client", () => ({ apiClient: vi.fn(), removeStoredToken: vi.fn(), setStoredToken: vi.fn() }));

import { apiClient } from "../api/client";
import { adminApi } from "../api/admin.api";
import { authApi, toUser } from "../api/auth.api";

const client = vi.mocked(apiClient);

const be = {
  id: 7,
  email: "an@pduni.edu.vn",
  display_name: "Annie",
  role: "student",
  first_use: null,
  state: "active",
  credits: 1,
  storage_used: 0,
  storage_limit: 10,
};

beforeEach(() => vi.clearAllMocks());

describe("user display name", () => {
  it("reads display_name from a response that has no name", () => {
    const user = toUser(be as never);
    expect(user.display_name).toBe("Annie");
    expect(user).not.toHaveProperty("name");
  });

  it("falls back to the legacy name, then the email prefix", () => {
    expect(toUser({ ...be, display_name: undefined, name: "Old" } as never).display_name).toBe("Old");
    expect(toUser({ ...be, display_name: "", name: undefined } as never).display_name).toBe("an");
  });

  it("sends display_name for profile updates", async () => {
    client.mockResolvedValue(be);
    await authApi.updateProfile({ display_name: null });
    expect(client).toHaveBeenCalledWith("/api/users/@me", { method: "PATCH", body: JSON.stringify({ display_name: null }) });
  });
});

describe("admin filters", () => {
  it("adds user_id to the users and chats requests only when given", async () => {
    client.mockResolvedValue([]);
    await adminApi.getUsers(2);
    await adminApi.getUsers(1, "42");
    await adminApi.getAllChats(3, "42");
    await adminApi.getAllChats(1, null);
    expect(client.mock.calls.map((c) => c[0])).toEqual([
      "/api/admin/users?p=2",
      "/api/admin/users?p=1&user_id=42",
      "/api/admin/chats?p=3&user_id=42",
      "/api/admin/chats?p=1",
    ]);
  });

  it("keeps the owner name, with null for a deleted user", async () => {
    client.mockResolvedValue([
      { id: "1", title: "a", disabled: false, async_status: "none", user_id: "5", user_name: "Alice" },
      { id: "2", title: "b", disabled: false, async_status: "none", user_id: "6", user_name: null },
    ]);
    const chats = await adminApi.getAllChats();
    expect(chats.map((c) => c.userName)).toEqual(["Alice", null]);
  });
});