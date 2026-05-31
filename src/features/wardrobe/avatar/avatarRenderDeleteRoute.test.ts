import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteRender: vi.fn(),
  softDeleteRender: vi.fn(),
  requireAccountSession: vi.fn(),
}));

vi.mock("@/src/features/account/accountSession", () => ({
  requireAccountSession: mocks.requireAccountSession,
}));

vi.mock("@/src/features/wardrobe/real/supabaseServerClient", () => ({
  createSupabaseServiceClient: () => ({}),
}));

vi.mock("@/src/features/wardrobe/avatar/avatarPersistence", () => ({
  AvatarPersistence: vi.fn().mockImplementation(() => ({
    deleteRender: mocks.deleteRender,
    softDeleteRender: mocks.softDeleteRender,
  })),
}));

describe("avatar render delete API", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("permanently deletes avatar render rows instead of soft deleting them", async () => {
    mocks.requireAccountSession.mockResolvedValue({
      ok: true,
      circleId: "circle-1",
      profileId: "profile-1",
    });
    mocks.deleteRender.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/wardrobe/avatar/renders/[renderId]/route");

    const response = await DELETE(new Request("https://wearabouts.test/api/wardrobe/avatar/renders/render-1"), {
      params: Promise.resolve({ renderId: "render-1" }),
    });

    await expect(response.json()).resolves.toEqual({ deletedRenderId: "render-1" });
    expect(response.status).toBe(200);
    expect(mocks.deleteRender).toHaveBeenCalledWith("render-1");
    expect(mocks.softDeleteRender).not.toHaveBeenCalled();
  });
});
