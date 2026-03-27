import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: getMock,
  },
}));

import {
  fetchPlanningCompleteness,
  fetchProgrammeActivityBookingContext,
} from "@/hooks/lookahead/api";
import { lookaheadKeys } from "@/hooks/lookahead/keys";

describe("lookahead api", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("builds lookahead activity keys with filters", () => {
    expect(
      lookaheadKeys.activities("project-1", {
        weekStart: "2026-03-30",
        assetType: "scissor_lift",
      }),
    ).toBe(
      "/lookahead/project-1/activities?week_start=2026-03-30&asset_type=scissor_lift",
    );
  });

  it("normalizes programme activity booking context", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        activity_id: "activity-1",
        activity_name: "Facade install",
        expected_asset_type: "scissor_lift",
        selected_week_start: "2026-03-30",
        default_booking_date: "2026-04-01",
        default_start_time: "07:00:00",
        default_end_time: "09:00:00",
        suggested_bulk_dates: ["2026-04-01", "2026-04-02"],
        linked_bookings: [
          {
            id: "booking-1",
            manager_id: "manager-1",
            asset_id: "asset-1",
            booking_date: "2026-04-01",
            start_time: "07:00:00",
            end_time: "09:00:00",
            status: "confirmed",
          },
        ],
        candidate_assets: [
          {
            id: "asset-1",
            name: "Lift 01",
            availability_status: "available",
            planning_ready: true,
          },
        ],
      },
    });

    const context = await fetchProgrammeActivityBookingContext({
      activityId: "activity-1",
      selectedWeekStart: "2026-03-30",
    });

    expect(context).toMatchObject({
      activity_id: "activity-1",
      activity_name: "Facade install",
      expected_asset_type: "scissor_lift",
      suggested_bulk_dates: [
        {
          date: "2026-04-01",
          start_time: "07:00:00",
          end_time: "09:00:00",
        },
        {
          date: "2026-04-02",
          start_time: "07:00:00",
          end_time: "09:00:00",
        },
      ],
    });
    expect(context.linked_bookings).toHaveLength(1);
    expect(context.candidate_assets[0]).toMatchObject({
      id: "asset-1",
      availability_status: "available",
      planning_ready: true,
    });
  });

  it("preserves per-date remaining hours from string payloads", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        activity_id: "activity-2",
        activity_name: "Install window subframes",
        default_start_time: "08:00:00",
        default_end_time: "16:00:00",
        suggested_bulk_dates: [
          {
            date: "2026-04-20",
            remaining_hours: "8",
          },
          {
            date: "2026-04-21",
            remaining_hours: "8",
          },
          {
            date: "2026-04-22",
            remaining_hours: "0.5",
          },
        ],
        linked_bookings: [],
        candidate_assets: [],
      },
    });

    const context = await fetchProgrammeActivityBookingContext({
      activityId: "activity-2",
      selectedWeekStart: "2026-04-20",
    });

    expect(context.suggested_bulk_dates).toMatchObject([
      {
        date: "2026-04-20",
        hours: 8,
        gap_hours: 8,
      },
      {
        date: "2026-04-21",
        hours: 8,
        gap_hours: 8,
      },
      {
        date: "2026-04-22",
        hours: 0.5,
        gap_hours: 0.5,
      },
    ]);
  });

  it("normalizes planning completeness counts and tasks", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        score: 72,
        status: "at_risk",
        window_start: "2026-03-30",
        window_end: "2026-05-11",
        counts: {
          confirmed_assets: 4,
          unknown_assets: 2,
          blocking_total: 3,
        },
        actionable_tasks: [
          {
            id: "task-1",
            title: "Resolve unknown asset types",
            description: "Two assets are blocking lookahead coverage.",
            link: "/assets?filter=review",
          },
        ],
      },
    });

    const completeness = await fetchPlanningCompleteness("project-1");

    expect(completeness).toMatchObject({
      score: 72,
      status: "at_risk",
      counts: {
        confirmed_assets: 4,
        unknown_assets: 2,
        blocking_total: 3,
      },
    });
    expect(completeness.actionable_tasks[0]).toMatchObject({
      id: "task-1",
      title: "Resolve unknown asset types",
      link: "/assets?filter=review",
    });
  });
});
