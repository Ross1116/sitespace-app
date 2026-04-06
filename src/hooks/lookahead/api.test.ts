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
  fetchCapacityDashboard,
  fetchLookaheadHistory,
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

  it("builds capacity dashboard keys with filters", () => {
    expect(
      lookaheadKeys.capacityDashboard("project-1", {
        startWeek: "2026-03-30",
        weeks: 4,
      }),
    ).toBe(
      "/lookahead/project-1/capacity-dashboard?start_week=2026-03-30&weeks=4",
    );
  });

  it("normalizes capacity dashboard rows and summaries", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        project_id: "project-1",
        upload_id: "upload-1",
        start_week: "2026-03-30",
        weeks: ["2026-03-30", "2026-04-06"],
        work_days_per_week: 5,
        asset_types: ["scissor_lift"],
        rows: {
          scissor_lift: {
            "2026-03-30": {
              demand_hours: 32,
              booked_hours: 24,
              capacity_hours: 40,
              remaining_capacity_hours: 16,
              uncovered_demand_hours: 8,
              demand_utilization_pct: 80,
              booked_utilization_pct: 60,
              available_assets: 2,
              status: "tight",
              is_anomalous: true,
            },
          },
        },
        summary_by_week: {
          "2026-03-30": {
            total_demand_hours: 32,
            total_booked_hours: 24,
            total_capacity_hours: 40,
            overall_demand_utilization_pct: 80,
            overall_booked_utilization_pct: 60,
            worst_status: "tight",
          },
        },
        summary_by_asset_type: {
          scissor_lift: {
            total_demand_hours: 32,
            total_booked_hours: 24,
            total_capacity_hours: 40,
            peak_week: "2026-03-30",
            peak_demand_utilization_pct: 80,
            weeks_over_capacity: 0,
            weeks_tight: 1,
          },
        },
        diagnostics: {
          unresolved_asset_count: 1,
          other_demand_hours_total: 4,
          excluded_asset_types: ["tower_crane"],
          snapshot_id: "snapshot-1",
          snapshot_date: "2026-03-29",
          snapshot_refreshed_at: "2026-03-29T10:00:00Z",
          total_assets_evaluated: 9,
          excluded_not_planning_ready: 2,
          excluded_retired: 1,
          capacity_computed_at: "2026-03-29T10:30:00Z",
          assumptions: ["Bookings count toward demand coverage."],
        },
        message: "Capacity is based on planning-ready assets only.",
      },
    });

    const result = await fetchCapacityDashboard({
      projectId: "project-1",
      startWeek: "2026-03-30",
      weeks: 4,
    });

    expect(result).toMatchObject({
      project_id: "project-1",
      upload_id: "upload-1",
      weeks: ["2026-03-30", "2026-04-06"],
      asset_types: ["scissor_lift"],
      rows: {
        scissor_lift: {
          "2026-03-30": {
            demand_hours: 32,
            status: "tight",
            is_anomalous: true,
          },
        },
      },
      summary_by_week: {
        "2026-03-30": {
          total_capacity_hours: 40,
          worst_status: "tight",
        },
      },
      summary_by_asset_type: {
        scissor_lift: {
          peak_week: "2026-03-30",
          weeks_tight: 1,
        },
      },
      diagnostics: {
        unresolved_asset_count: 1,
        excluded_asset_types: ["tower_crane"],
      },
      message: "Capacity is based on planning-ready assets only.",
    });
  });

  it("defaults missing capacity collections to empty values", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        project_id: "project-2",
        start_week: "2026-04-06",
      },
    });

    const result = await fetchCapacityDashboard({
      projectId: "project-2",
      startWeek: "2026-04-06",
      weeks: 4,
    });

    expect(result).toMatchObject({
      project_id: "project-2",
      start_week: "2026-04-06",
      weeks: [],
      asset_types: [],
      rows: {},
      summary_by_week: {},
      summary_by_asset_type: {},
      diagnostics: null,
      message: null,
    });
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

  it("preserves snapshot history row counts when rows are summarized", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        history: [
          {
            snapshot_id: "snapshot-3",
            snapshot_date: "2026-03-28",
            timezone: "Australia/Sydney",
            row_count: 42,
          },
          {
            snapshot_id: "snapshot-2",
            snapshot_date: "2026-03-27",
            timezone: "Australia/Sydney",
            rows: [{ asset_type: "Crane" }],
          },
        ],
      },
    });

    const history = await fetchLookaheadHistory("project-1");

    expect(history).toMatchObject([
      {
        snapshot_id: "snapshot-3",
        row_count: 42,
        rows: [],
      },
      {
        snapshot_id: "snapshot-2",
        row_count: 1,
      },
    ]);
  });
});
