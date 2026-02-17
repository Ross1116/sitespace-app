export const ASSET_TYPE_OPTIONS = [
  "Equipment",
  "Vehicle",
  "Tool",
  "Machinery",
  "Loading Zone",
  "Storage Area",
  "Crane",
  "Excavator",
  "Generator",
  "Scaffolding",
  "Other",
] as const;

export const TRADE_SPECIALTY_OPTIONS = [
  { label: "Electrician", value: "electrician" },
  { label: "Plumber", value: "plumber" },
  { label: "Carpenter", value: "carpenter" },
  { label: "Mason", value: "mason" },
  { label: "Painter", value: "painter" },
  { label: "HVAC", value: "hvac" },
  { label: "Roofer", value: "roofer" },
  { label: "Landscaper", value: "landscaper" },
  { label: "General Contractor", value: "general" },
  { label: "Other", value: "other" },
] as const;

export const QUARTER_HOUR_OPTIONS = ["00", "15", "30", "45"] as const;

export const BOOKING_DURATION_OPTIONS = [
  15, 30, 45, 60, 90, 120, 180, 240, 300, 360,
] as const;
