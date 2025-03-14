import { addDays, addHours } from "date-fns";

export const calendars = [
  {
    name: "Asset A",
    events: [
      {
        id: "a1",
        start: new Date(),
        end: addHours(new Date(), 2),
        title: "Subcontractor A",
        color: "pink" as const,
      },
      {
        id: "a2",
        start: addHours(new Date(), 4),
        end: addHours(new Date(), 5),
        title: "Subcontractor C",
        color: "green" as const,
      },
    ],
  },
  {
    name: "Asset B",
    events: [
      {
        id: "b1",
        start: addHours(new Date(), 1.5),
        end: addHours(new Date(), 3),
        title: "Subcontractor B",
        color: "blue" as const,
      },
      {
        id: "b2",
        start: addHours(addDays(new Date(), 1), 2),
        end: addHours(addDays(new Date(), 1), 0),
        title: "Subcontractor A",
        color: "purple" as const,
      },
    ],
  },
  {
    name: "Asset C",
    events: [
      {
        id: "c1",
        start: addHours(new Date(), 1.5),
        end: addHours(new Date(), 3),
        title: "Subcontractor E",
        color: "blue" as const,
      },
      {
        id: "c2",
        start: addHours(addDays(new Date(), 1), 1),
        end: addHours(addDays(new Date(), 1), 6),
        title: "Subcontractor D",
        color: "pink" as const,
      },
    ],
  },
  {
    name: "Asset D",
    events: [
      {
        id: "d1",
        start: addHours(new Date(), 1.5),
        end: addHours(new Date(), 3),
        title: "Subcontractor D",
        color: "blue" as const,
      },
      {
        id: "d2",
        start: addHours(addDays(new Date(), 1), -2),
        end: addHours(addDays(new Date(), 1), 4),
        title: "Subcontractor C",
        color: "green" as const,
      },
    ],
  },
];


export const announcements = [
  {
    title: "Your call has been confirmed.",
    description: "1 hour ago",
  },
  {
    title: "You have a new message!",
    description: "1 hour ago",
  },
  {
    title: "Your booking is about to begin soon!",
    description: "2 hours ago",
  },
]

export const subcontractors = [
  {
    contractorKey: "SC001",
    contractorProject: ["PRJ001", "PRJ003"],
    contractorName: "Joel Anderson",
    contractorCompany: "ProPeak",
    contractorTrade: "Electrical",
    contractorEmail: "joel.anderson@propeak.com",
    contractorPhone: "555-123-4567",
    createdBy: "USR001",
    createdDt: "2025-01-15T09:30:00Z",
    spaceIdRef: "SPC001"
  },
  {
    contractorKey: "SC002",
    contractorProject: ["PRJ002", "PRJ004", "PRJ005"],
    contractorName: "Marcus Sullivan",
    contractorCompany: "Etero",
    contractorTrade: "Plumbing",
    contractorEmail: "marcus@etero.com",
    contractorPhone: "555-234-5678",
    createdBy: "USR001",
    createdDt: "2025-01-18T14:45:00Z",
    spaceIdRef: "SPC001"
  },
  {
    contractorKey: "SC003",
    contractorProject: ["PRJ001", "PRJ006"],
    contractorName: "Aiden Mitchell",
    contractorCompany: "Emogeum",
    contractorTrade: "HVAC",
    contractorEmail: "aiden@emogeum.com",
    contractorPhone: "555-345-6789",
    createdBy: "USR002",
    createdDt: "2025-01-20T11:15:00Z",
    spaceIdRef: "SPC002"
  },
  {
    contractorKey: "SC004",
    contractorProject: ["PRJ003", "PRJ007"],
    contractorName: "Isabella Donovan",
    contractorCompany: "ProjectPulse",
    contractorTrade: "Carpentry",
    contractorEmail: "isabella@projectpulse.com",
    contractorPhone: "555-456-7890",
    createdBy: "USR002",
    createdDt: "2025-01-22T16:30:00Z",
    spaceIdRef: "SPC002"
  },
  {
    contractorKey: "SC005",
    contractorProject: ["PRJ002", "PRJ008"],
    contractorName: "John Carter",
    contractorCompany: "Arcboy",
    contractorTrade: "Masonry",
    contractorEmail: "john@arcboy.com",
    contractorPhone: "555-567-8901",
    createdBy: "USR003",
    createdDt: "2025-01-25T10:00:00Z",
    spaceIdRef: "SPC003"
  },
  {
    contractorKey: "SC006",
    contractorProject: ["PRJ004", "PRJ009"],
    contractorName: "Ethan Gallagher",
    contractorCompany: "Vitalverve",
    contractorTrade: "Roofing",
    contractorEmail: "ethan@vitalverve.com",
    contractorPhone: "555-678-9012",
    createdBy: "USR003",
    createdDt: "2025-01-28T13:20:00Z",
    spaceIdRef: "SPC003"
  },
  {
    contractorKey: "SC007",
    contractorProject: ["PRJ005", "PRJ010"],
    contractorName: "Grace Robinson",
    contractorCompany: "Quantum",
    contractorTrade: "Painting",
    contractorEmail: "grace@quantum.com",
    contractorPhone: "555-789-0123",
    createdBy: "USR004",
    createdDt: "2025-02-01T15:45:00Z",
    spaceIdRef: "SPC004"
  },
  {
    contractorKey: "SC008",
    contractorProject: ["PRJ006", "PRJ007", "PRJ008"],
    contractorName: "Charlotte Hayes",
    contractorCompany: "Loomroom",
    contractorTrade: "Flooring",
    contractorEmail: "charlotte@loomroom.com",
    contractorPhone: "555-890-1234",
    createdBy: "USR004",
    createdDt: "2025-02-05T09:10:00Z",
    spaceIdRef: "SPC004"
  },
  {
    contractorKey: "SC009",
    contractorProject: ["PRJ009", "PRJ010"],
    contractorName: "Matthew Kim",
    contractorCompany: "ZenithWell",
    contractorTrade: "Landscaping",
    contractorEmail: "matthew@zenithwell.com",
    contractorPhone: "555-901-2345",
    createdBy: "USR005",
    createdDt: "2025-02-08T11:30:00Z",
    spaceIdRef: "SPC005"
  },
  {
    contractorKey: "SC010",
    contractorProject: ["PRJ003", "PRJ007", "PRJ009"],
    contractorName: "Sophia Rodriguez",
    contractorCompany: "StructureSync",
    contractorTrade: "Structural Engineering",
    contractorEmail: "sophia@structuresync.com",
    contractorPhone: "555-012-3456",
    createdBy: "USR005",
    createdDt: "2025-02-12T10:15:00Z",
    spaceIdRef: "SPC005"
  },
  {
    contractorKey: "SC011",
    contractorProject: ["PRJ001", "PRJ010"],
    contractorName: "Benjamin Foster",
    contractorCompany: "GlassWorks",
    contractorTrade: "Glazing",
    contractorEmail: "ben@glassworks.com",
    contractorPhone: "555-123-4567",
    createdBy: "USR006",
    createdDt: "2025-02-15T14:30:00Z",
    spaceIdRef: "SPC006"
  },
  {
    contractorKey: "SC012",
    contractorProject: ["PRJ002", "PRJ004", "PRJ006"],
    contractorName: "Emma Thompson",
    contractorCompany: "EcoTech",
    contractorTrade: "Insulation",
    contractorEmail: "emma@ecotech.com",
    contractorPhone: "555-234-5678",
    createdBy: "USR006",
    createdDt: "2025-02-18T09:45:00Z",
    spaceIdRef: "SPC006"
  },
  {
    contractorKey: "SC013",
    contractorProject: ["PRJ005", "PRJ008"],
    contractorName: "Daniel Wilson",
    contractorCompany: "MetalCraft",
    contractorTrade: "Welding",
    contractorEmail: "daniel@metalcraft.com",
    contractorPhone: "555-345-6789",
    createdBy: "USR007",
    createdDt: "2025-02-22T11:20:00Z",
    spaceIdRef: "SPC007"
  },
  {
    contractorKey: "SC014",
    contractorProject: ["PRJ003", "PRJ007", "PRJ010"],
    contractorName: "Olivia Chen",
    contractorCompany: "InteriorVision",
    contractorTrade: "Interior Design",
    contractorEmail: "olivia@interiorvision.com",
    contractorPhone: "555-456-7890",
    createdBy: "USR007",
    createdDt: "2025-02-25T15:40:00Z",
    spaceIdRef: "SPC007"
  }
];

export const assets = [
  {
    assetKey: "AST001",
    assetProject: "PRJ001",
    assetTitle: "Tower Crane",
    assetLocation: "North Sector",
    assetStatus: "Active",
    assetPoc: "Joel Anderson",
    maintanenceStartdt: "2025-02-10",
    maintanenceEnddt: "2025-02-15",
    usageInstructions: "Operate only with certified personnel"
  },
  {
    assetKey: "AST002",
    assetProject: "PRJ002",
    assetTitle: "Concrete Mixer",
    assetLocation: "South Building Foundation",
    assetStatus: "Maintenance",
    assetPoc: "Marcus Sullivan",
    maintanenceStartdt: "2025-02-20",
    maintanenceEnddt: "2025-02-25",
    usageInstructions: "Clean thoroughly after each use"
  },
  {
    assetKey: "AST003",
    assetProject: "PRJ001",
    assetTitle: "Excavator CAT 320",
    assetLocation: "East Excavation Site",
    assetStatus: "Active",
    assetPoc: "Aiden Mitchell",
    maintanenceStartdt: "2025-03-05",
    maintanenceEnddt: "2025-03-10",
    usageInstructions: "Daily fluid checks required"
  },
  {
    assetKey: "AST004",
    assetProject: "PRJ003",
    assetTitle: "Scaffolding System",
    assetLocation: "West Wing",
    assetStatus: "Active",
    assetPoc: "Isabella Donovan",
    maintanenceStartdt: "2025-03-15",
    maintanenceEnddt: "2025-03-18",
    usageInstructions: "Inspect connections daily"
  },
  {
    assetKey: "AST005",
    assetProject: "PRJ002",
    assetTitle: "Generator 50kW",
    assetLocation: "Central Power Hub",
    assetStatus: "Active",
    assetPoc: "John Carter",
    maintanenceStartdt: "2025-03-25",
    maintanenceEnddt: "2025-03-30",
    usageInstructions: "Check fuel levels every shift"
  },
  {
    assetKey: "AST006",
    assetProject: "PRJ004",
    assetTitle: "Portable Office",
    assetLocation: "Site Entrance",
    assetStatus: "Active",
    assetPoc: "Ethan Gallagher",
    maintanenceStartdt: "2025-04-05",
    maintanenceEnddt: "2025-04-10",
    usageInstructions: "Lock all doors when not in use"
  },
  {
    assetKey: "AST007",
    assetProject: "PRJ005",
    assetTitle: "Water Pump",
    assetLocation: "Basement Level 2",
    assetStatus: "Inactive",
    assetPoc: "Grace Robinson",
    maintanenceStartdt: "2025-04-15",
    maintanenceEnddt: "2025-04-20",
    usageInstructions: "Prime before operation"
  },
  {
    assetKey: "AST008",
    assetProject: "PRJ003",
    assetTitle: "Forklift",
    assetLocation: "Materials Storage",
    assetStatus: "Active",
    assetPoc: "Charlotte Hayes",
    maintanenceStartdt: "2025-04-25",
    maintanenceEnddt: "2025-04-30",
    usageInstructions: "Certified operators only"
  },
  {
    assetKey: "AST009",
    assetProject: "PRJ001",
    assetTitle: "Air Compressor",
    assetLocation: "Tool Shed",
    assetStatus: "Active",
    assetPoc: "Matthew Kim",
    maintanenceStartdt: "2025-05-05",
    maintanenceEnddt: "2025-05-10",
    usageInstructions: "Drain moisture daily"
  },
  {
    assetKey: "AST010",
    assetProject: "PRJ002",
    assetTitle: "Surveying Equipment",
    assetLocation: "Engineering Office",
    assetStatus: "Active",
    assetPoc: "Sophia Rodriguez",
    maintanenceStartdt: "2025-05-15",
    maintanenceEnddt: "2025-05-20",
    usageInstructions: "Calibrate before each use"
  },
  {
    assetKey: "AST011",
    assetProject: "PRJ004",
    assetTitle: "Cement Silo",
    assetLocation: "Batch Plant",
    assetStatus: "Active",
    assetPoc: "Benjamin Foster",
    maintanenceStartdt: "2025-05-25",
    maintanenceEnddt: "2025-05-30",
    usageInstructions: "Check pressure gauges regularly"
  },
  {
    assetKey: "AST012",
    assetProject: "PRJ003",
    assetTitle: "Portable Lighting",
    assetLocation: "Night Work Area",
    assetStatus: "Maintenance",
    assetPoc: "Emma Thompson",
    maintanenceStartdt: "2025-06-05",
    maintanenceEnddt: "2025-06-10",
    usageInstructions: "Keep away from water sources"
  }
];

export const bookings = [
  {
    bookingKey: "BKG001",
    bookingProject: "PRJ001",
    bookingTitle: "Foundation Excavation",
    bookingFor: "Equipment",
    bookedAssets: ["AST001", "AST003"],
    bookingStatus: "Pending",
    bookingTimedt: "2025-03-13T20:00:00Z", // March 13, 7am AEDT (UTC+11)
    bookingDurationMins: 240, // 4 hours, ends at 11am AEDT
    bookingDescription: "Excavation for the main building foundation",
    bookingNotes: "Need crane and excavator for the entire morning",
    bookingCreatedBy: "USR002",
    bookingCreatedDt: "2025-03-10T14:30:00Z"
  },
  {
    bookingKey: "BKG002",
    bookingProject: "PRJ002",
    bookingTitle: "Concrete Pouring",
    bookingFor: "Equipment",
    bookedAssets: ["AST002", "AST005"],
    bookingStatus: "Confirmed",
    bookingTimedt: "2025-03-13T22:30:00Z", // March 13, 9:30am AEDT
    bookingDurationMins: 180, // 3 hours, ends at 12:30pm AEDT
    bookingDescription: "Pouring concrete for the south building foundation",
    bookingNotes: "Will need mixer and generator",
    bookingCreatedBy: "USR001",
    bookingCreatedDt: "2025-03-12T10:15:00Z"
  },
  {
    bookingKey: "BKG003",
    bookingProject: "PRJ003",
    bookingTitle: "Scaffolding Installation",
    bookingFor: "Equipment",
    bookedAssets: ["AST004", "AST008"],
    bookingStatus: "Pending",
    bookingTimedt: "2025-03-14T20:00:00Z", // March 14, 7am AEDT
    bookingDurationMins: 300, // 5 hours, ends at 12pm AEDT
    bookingDescription: "Setting up scaffolding on the west wing",
    bookingNotes: "Will need forklift to move materials",
    bookingCreatedBy: "USR004",
    bookingCreatedDt: "2025-03-11T16:45:00Z"
  },
  {
    bookingKey: "BKG004",
    bookingProject: "PRJ001",
    bookingTitle: "Tool Maintenance",
    bookingFor: "Service",
    bookedAssets: ["AST009"],
    bookingStatus: "Confirmed",
    bookingTimedt: "2025-03-14T02:00:00Z", // March 14, 1pm AEDT
    bookingDurationMins: 120, // 2 hours, ends at 3pm AEDT
    bookingDescription: "Regular maintenance of air compressor",
    bookingNotes: "Need to be completed before weekend work",
    bookingCreatedBy: "USR002",
    bookingCreatedDt: "2025-03-12T09:30:00Z"
  },
  {
    bookingKey: "BKG005",
    bookingProject: "PRJ002",
    bookingTitle: "Site Survey",
    bookingFor: "Equipment",
    bookedAssets: ["AST010"],
    bookingStatus: "Denied",
    bookingTimedt: "2025-03-14T23:00:00Z", // March 14, 10am AEDT
    bookingDurationMins: 180, // 3 hours, ends at 1pm AEDT
    bookingDescription: "Topographical survey of extension area",
    bookingNotes: "Equipment needed for another project",
    bookingCreatedBy: "USR003",
    bookingCreatedDt: "2025-03-11T11:20:00Z"
  },
  {
    bookingKey: "BKG006",
    bookingProject: "PRJ004",
    bookingTitle: "Cement Delivery",
    bookingFor: "Equipment",
    bookedAssets: ["AST011", "AST006"],
    bookingStatus: "Pending",
    bookingTimedt: "2025-03-15T21:30:00Z", // March 15, 8:30am AEDT
    bookingDurationMins: 90, // 1.5 hours, ends at 10am AEDT
    bookingDescription: "Receiving cement delivery at batch plant",
    bookingNotes: "Need portable office for paperwork",
    bookingCreatedBy: "USR005",
    bookingCreatedDt: "2025-03-12T14:10:00Z"
  },
  {
    bookingKey: "BKG007",
    bookingProject: "PRJ003",
    bookingTitle: "Lighting Setup",
    bookingFor: "Equipment",
    bookedAssets: ["AST012"],
    bookingStatus: "Confirmed",
    bookingTimedt: "2025-03-13T04:00:00Z", // March 13, 3pm AEDT
    bookingDurationMins: 180, // 3 hours, ends at 6pm AEDT
    bookingDescription: "Setting up lighting for evening work",
    bookingNotes: "Will need lighting setup before sunset",
    bookingCreatedBy: "USR004",
    bookingCreatedDt: "2025-03-12T15:30:00Z"
  },
  {
    bookingKey: "BKG008",
    bookingProject: "PRJ005",
    bookingTitle: "Basement Drainage",
    bookingFor: "Equipment",
    bookedAssets: ["AST007"],
    bookingStatus: "Pending",
    bookingTimedt: "2025-03-15T00:00:00Z", // March 15, 11am AEDT
    bookingDurationMins: 240, // 4 hours, ends at 3pm AEDT
    bookingDescription: "Pumping water from basement after rainfall",
    bookingNotes: "Emergency request",
    bookingCreatedBy: "USR006",
    bookingCreatedDt: "2025-03-13T07:45:00Z"
  }
];