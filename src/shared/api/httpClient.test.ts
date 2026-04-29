import { describe, it, expect, vi, beforeEach } from "vitest";
import { store } from "@/app/store.ts";
import { setTokens, clearTokens } from "@/app/authSlice.ts";
import { ApiError } from "@/shared/api/ApiError.ts";
import { serviceGet, userRequest } from "./httpClient.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeResponse = (status: number, body?: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body ?? {}),
  }) as unknown as Response;

const setAuthTokens = () =>
  store.dispatch(setTokens({ accessToken: "access-token", refreshToken: "refresh-token" }));

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  store.dispatch(clearTokens());
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// serviceGet
// ---------------------------------------------------------------------------

describe("serviceGet", () => {
  it("returns parsed JSON on a successful response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(200, { name: "Arthas" })));
    const result = await serviceGet<{ name: string }>("/characters/1");
    expect(result).toEqual({ name: "Arthas" });
  });

  it("throws ApiError when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(404)));
    await expect(serviceGet("/missing")).rejects.toBeInstanceOf(ApiError);
  });
});

// ---------------------------------------------------------------------------
// userRequest
// ---------------------------------------------------------------------------

describe("userRequest", () => {
  it("returns parsed JSON on a successful response", async () => {
    setAuthTokens();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(200, { id: "v1" })));
    const result = await userRequest<{ id: string }>("GET", "/views/v1");
    expect(result).toEqual({ id: "v1" });
  });

  it("throws ApiError on a non-401 error", async () => {
    setAuthTokens();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(500)));
    await expect(userRequest("GET", "/views/v1")).rejects.toBeInstanceOf(ApiError);
  });

  it("refreshes the token and retries on 401", async () => {
    setAuthTokens();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(200, { accessToken: "new-token" }))
      .mockResolvedValueOnce(makeResponse(200, { id: "v1" }));

    vi.stubGlobal("fetch", mockFetch);

    const result = await userRequest<{ id: string }>("GET", "/views/v1");

    expect(result).toEqual({ id: "v1" });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(store.getState().auth.accessToken).toBe("new-token");
  });

  it("clears tokens and throws when the refresh request fails", async () => {
    setAuthTokens();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(401));

    vi.stubGlobal("fetch", mockFetch);

    await expect(userRequest("GET", "/views/v1")).rejects.toBeInstanceOf(ApiError);
    expect(store.getState().auth.accessToken).toBeNull();
    expect(store.getState().auth.refreshToken).toBeNull();
  });

  it("throws when there is no refresh token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(401)));
    await expect(userRequest("GET", "/views/v1")).rejects.toBeInstanceOf(ApiError);
  });

  it("performs only one refresh when multiple concurrent requests get 401", async () => {
    setAuthTokens();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(200, { accessToken: "new-token" }))
      .mockResolvedValueOnce(makeResponse(200, { id: "1" }))
      .mockResolvedValueOnce(makeResponse(200, { id: "2" }));

    vi.stubGlobal("fetch", mockFetch);

    const [r1, r2] = await Promise.all([
      userRequest<{ id: string }>("GET", "/views/1"),
      userRequest<{ id: string }>("GET", "/views/2"),
    ]);

    expect(r1).toEqual({ id: "1" });
    expect(r2).toEqual({ id: "2" });

    const refreshCalls = mockFetch.mock.calls.filter((c) =>
      (c[0] as string).includes("/auth/refresh"),
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it("rejects all queued requests when the refresh fails", async () => {
    setAuthTokens();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(401));

    vi.stubGlobal("fetch", mockFetch);

    const [r1, r2] = await Promise.allSettled([
      userRequest("GET", "/views/1"),
      userRequest("GET", "/views/2"),
    ]);

    expect(r1.status).toBe("rejected");
    expect(r2.status).toBe("rejected");
  });
});
