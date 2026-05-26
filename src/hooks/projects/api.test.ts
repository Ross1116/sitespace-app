import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: getMock,
  },
}));

import { fetchProject } from "@/hooks/projects/api";

describe("projects api", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("normalizes a project start date from the detail endpoint", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        id: "project-1",
        name: "Alpha",
        location: "Sydney",
        project_start_date: "2026-01-14",
      },
    });

    const project = await fetchProject("project-1");

    expect(project).toMatchObject({
      id: "project-1",
      name: "Alpha",
      location: "Sydney",
      start_date: "2026-01-14",
    });
  });
});
