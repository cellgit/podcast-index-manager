import { beforeEach, vi } from "vitest";

vi.stubGlobal("fetch", vi.fn());

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("fetch", vi.fn());
});
