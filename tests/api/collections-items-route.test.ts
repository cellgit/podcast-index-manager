import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    podcastCollectionItem: {
      deleteMany: mocks.deleteManyMock,
    },
  },
}));

// The route relies on zod which reads params synchronously, so we can import after mocking.
import { DELETE } from "@/app/api/library/collections/[id]/items/route";

describe("DELETE /api/library/collections/[id]/items", () => {
  beforeEach(() => {
    mocks.deleteManyMock.mockReset();
  });

  it("returns success with removed count when records exist", async () => {
    mocks.deleteManyMock.mockResolvedValueOnce({ count: 2 });

    const response = await DELETE(
      new Request("http://localhost/api/library/collections/1/items?podcastId=42"),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, removed: 2 });
    expect(mocks.deleteManyMock).toHaveBeenCalledWith({
      where: { collection_id: 1, podcast_id: 42 },
    });
  });

  it("returns success even when nothing is deleted", async () => {
    mocks.deleteManyMock.mockResolvedValueOnce({ count: 0 });

    const response = await DELETE(
      new Request("http://localhost/api/library/collections/1/items?podcastId=99"),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, removed: 0 });
  });
});
