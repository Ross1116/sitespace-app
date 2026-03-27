import { describe, expect, it } from "vitest";
import { normalizeAssetList, normalizeBookingList } from "@/lib/apiNormalization";

describe("apiNormalization", () => {
  it("retains booking provenance and linked activity metadata", () => {
    const bookings = normalizeBookingList({
      bookings: [
        {
          id: "b1",
          manager_id: "m1",
          asset_id: "a1",
          booking_date: "2026-04-01",
          start_time: "07:00:00",
          end_time: "08:00:00",
          status: "confirmed",
          source: "programme_activity",
          booking_group_id: "group-1",
          programme_activity_id: "activity-1",
          programme_activity_name: "Install facade panels",
          expected_asset_type: "scissor_lift",
          is_modified: true,
          asset: {
            id: "a1",
            name: "Lift 01",
            asset_code: "L-01",
            canonical_type: "scissor_lift",
            planning_ready: true,
          },
        },
      ],
    });

    expect(bookings).toHaveLength(1);
    expect(bookings[0]).toMatchObject({
      source: "programme_activity",
      booking_group_id: "group-1",
      programme_activity_id: "activity-1",
      programme_activity_name: "Install facade panels",
      expected_asset_type: "scissor_lift",
      is_modified: true,
      asset: {
        canonical_type: "scissor_lift",
        planning_ready: true,
      },
    });
  });

  it("retains planning readiness metadata on assets", () => {
    const assets = normalizeAssetList({
      assets: [
        {
          id: "a1",
          asset_code: "MC-01",
          name: "Main Crane",
          status: "available",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
          type: "crane",
          canonical_type: "tower_crane",
          type_resolution_status: "inferred",
          type_inference_source: "programme",
          type_inference_confidence: 0.87,
          planning_ready: false,
        },
      ],
    });

    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({
      canonical_type: "tower_crane",
      type_resolution_status: "inferred",
      type_inference_source: "programme",
      type_inference_confidence: 0.87,
      planning_ready: false,
    });
  });
});
