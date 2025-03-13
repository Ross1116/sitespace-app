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