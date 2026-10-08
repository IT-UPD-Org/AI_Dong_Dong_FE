import { afterEach, expect, it, vi } from "vitest";
import { authApi } from "../api/auth.api";
import { apiClient } from "../api/client";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

it("does not authenticate an arbitrary token when the backend is unavailable", async () => {
  localStorage.setItem("access_token", "unknown-token");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  expect(await authApi.getCurrentUser()).toBeNull();
});

it("does not authenticate an expired development token", async () => {
  localStorage.setItem("access_token", `header.${btoa(JSON.stringify({ sub: "student@example.com", exp: 1 }))}.mock_signature`);
  expect(await authApi.getCurrentUser()).toBeNull();
});

it("removes the old token immediately and does not clear a later login", async () => {
  localStorage.setItem("access_token", "old-token");
  let finish!: (result: Response) => void;
  const fetchMock = vi.fn().mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  vi.stubGlobal("fetch", fetchMock);
  const logout = authApi.logout();
  expect(localStorage.getItem("access_token")).toBeNull();
  expect(new Headers(fetchMock.mock.calls[0][1].headers).get("Authorization")).toBe("Bearer old-token");
  localStorage.setItem("access_token", "new-token");
  finish(new Response(null, { status: 204 }));
  await logout;
  expect(localStorage.getItem("access_token")).toBe("new-token");
});

it("leaves token persistence to the active authentication session", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    status: "ok", access_token: "verified-token", user: { id: "1", role: "student" },
  }))));
  expect((await authApi.verifyMagicLink("verification")).access_token).toBe("verified-token");
  expect(localStorage.getItem("access_token")).toBeNull();
});

it("does not end a newer session when an old request returns 401", async () => {
  localStorage.setItem("access_token", "old-token");
  let finish!: (result: Response) => void;
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise((resolve) => { finish = resolve; })));
  const unauthorized = vi.fn();
  window.addEventListener("auth:unauthorized", unauthorized);
  try {
    const request = apiClient("/users/@me");
    localStorage.setItem("access_token", "new-token");
    finish(new Response("{}", { status: 401 }));
    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem("access_token")).toBe("new-token");
    expect(unauthorized).not.toHaveBeenCalled();
  } finally {
    window.removeEventListener("auth:unauthorized", unauthorized);
  }
});

it("does not request another logout if the logout endpoint returns 401", async () => {
  localStorage.setItem("access_token", "old-token");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
  const unauthorized = vi.fn();
  window.addEventListener("auth:unauthorized", unauthorized);
  try {
    await authApi.logout();
    expect(unauthorized).not.toHaveBeenCalled();
  } finally {
    window.removeEventListener("auth:unauthorized", unauthorized);
  }
});
