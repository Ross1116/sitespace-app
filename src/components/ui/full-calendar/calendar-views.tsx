"use client";

import { reportError } from "@/lib/monitoring";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  addDays,
  addHours,
  addMinutes,
  differenceInMinutes,
  format,
  getMonth,
  isSameDay,
  isSameHour,
  isSameMonth,
  isToday,
  setMonth,
  startOfWeek,
} from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useMemo, SetStateAction } from "react";
import {
  useCalendar,
  dayEventVariants,
  monthEventVariants,
  CalendarEvent,
} from "./calendar-context";
import { getDaysInMonth, generateWeekdays } from "./calendar-helpers";
import { TimeTable } from "./calendar-utils";
import { AssetCalendar } from "./calendar-context";
import { CreateBookingForm } from "@/components/forms/CreateBookingForm";
import { BookingDetailsDialog } from "@/components/multicalendar/BookingDetailDialog";
import { useMulticalendarActions } from "@/components/multicalendar/MulticalendarActionsContext";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import api from "@/lib/api";
import { AlertCircle, Ban, Loader2 } from "lucide-react";

const EARLIEST_START_HOUR = 6; // 6:00 AM
const LATEST_END_HOUR = 20; // 8:00 PM

type MaintenanceAsset = {
  status?: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toMaintenanceAsset = (value: unknown): MaintenanceAsset => {
  if (isRecord(value)) {
    return {
      status: typeof value.status === "string" ? value.status : undefined,
      maintenance_start_date:
        typeof value.maintenance_start_date === "string"
          ? value.maintenance_start_date
          : undefined,
      maintenance_end_date:
        typeof value.maintenance_end_date === "string"
          ? value.maintenance_end_date
          : undefined,
    };
  }
  return {};
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isCalendarColor = (value: unknown): value is CalendarEvent["color"] => {
  return ["default", "blue", "green", "pink", "purple", "yellow"].includes(
    String(value),
  );
};

const toCalendarEvent = (value: unknown): CalendarEvent | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string") return null;

  const start = toDate(value.start);
  const end = toDate(value.end);
  if (!start || !end) return null;

  return {
    id: value.id,
    start,
    end,
    title: typeof value.title === "string" ? value.title : "",
    description: typeof value.description === "string" ? value.description : "",
    color: isCalendarColor(value.color) ? value.color : "default",
    bookingKey:
      typeof value.bookingKey === "string" ? value.bookingKey : undefined,
    bookingTitle:
      typeof value.bookingTitle === "string" ? value.bookingTitle : undefined,
    bookingNotes:
      typeof value.bookingNotes === "string" ? value.bookingNotes : undefined,
    _originalData: isRecord(value._originalData)
      ? value._originalData
      : undefined,
  };
};

const getString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const DraggableEventWrapper = ({
  event,
  children,
  disabled,
}: {
  event: CalendarEvent;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id,
      data: event,
      disabled: disabled, // Pass disabled state to dnd-kit
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    height: "100%",
    touchAction: "none",
    cursor: disabled ? "not-allowed" : "grab", // Visual cue
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

export const CalendarDayView = ({
  assetCalendar,
  onActionComplete,
  onBookingCreated,
}: {
  assetCalendar?: AssetCalendar;
  onActionComplete?: () => void;
  onBookingCreated?: (
    events: Partial<CalendarEvent>[] | Partial<CalendarEvent>,
  ) => void;
}) => {
  const multicalendarActions = useMulticalendarActions();
  const effectiveOnActionComplete =
    onActionComplete ?? multicalendarActions?.onActionComplete;
  const effectiveOnBookingCreated =
    onBookingCreated ?? multicalendarActions?.onBookingCreated;

  const { events, date, setEvents } = useCalendar();

  // --- 1. MAINTENANCE LOGIC ---
  const asset = toMaintenanceAsset(assetCalendar?.asset);

  const isSlotInMaintenance = (slotDate: Date) => {
    if (!asset) return false;

    const status = getString(asset.status).toLowerCase();
    const isUnavailable =
      status === "maintenance" ||
      status === "retired" ||
      status.includes("broken") ||
      status.includes("repair");

    // If maintenance dates exist, they define the exact blocked window
    if (asset.maintenance_start_date && asset.maintenance_end_date) {
      // Normalize: extract the YYYY-MM-DD prefix to handle ISO datetime strings
      const startDateStr = asset.maintenance_start_date.split("T")[0];
      const endDateStr = asset.maintenance_end_date.split("T")[0];

      const [sy, sm, sd] = startDateStr.split("-").map(Number);
      const [ey, em, ed] = endDateStr.split("-").map(Number);

      // Validate that all parsed components are finite numbers (not NaN)
      if ([sy, sm, sd, ey, em, ed].every((n) => Number.isFinite(n))) {
        const start = new Date(sy, sm - 1, sd, 0, 0, 0); // 12:00 AM local
        const end = new Date(ey, em - 1, ed, 23, 59, 59); // 11:59 PM local
        return slotDate >= start && slotDate <= end;
      }

      // Parsing failed — fall back to status-based unavailability check
      return isUnavailable;
    }

    // No dates — if status is unavailable, block everything
    return isUnavailable;
  };

  // --- STATES ---
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date | null;
    end: Date | null;
    assetName?: string;
  }>({
    start: null,
    end: null,
    assetName: assetCalendar?.name,
  });

  const [pendingReschedule, setPendingReschedule] = useState<{
    event: CalendarEvent;
    newStart: Date;
    newEnd: Date;
  } | null>(null);
  const [validationError, setValidationError] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor),
  );

  // --- DRAG LOGIC ---
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, delta } = e;
    const PIXELS_PER_HOUR = 48;
    const rawMinutesMoved = (delta.y / PIXELS_PER_HOUR) * 60;
    const SNAP_INCREMENT = 30;
    const snappedMinutes =
      Math.round(rawMinutesMoved / SNAP_INCREMENT) * SNAP_INCREMENT;

    if (snappedMinutes === 0) return;

    const eventData = toCalendarEvent(active.data.current);
    if (!eventData) return;
    const oldStart = new Date(eventData.start);
    const oldEnd = new Date(eventData.end);
    const newStart = addMinutes(oldStart, snappedMinutes);
    const newEnd = addMinutes(oldEnd, snappedMinutes);

    if (!isSameDay(newStart, oldStart)) return;

    // Time Boundaries
    const startHour = newStart.getHours() + newStart.getMinutes() / 60;
    const endHour = newEnd.getHours() + newEnd.getMinutes() / 60;

    if (startHour < EARLIEST_START_HOUR) {
      setValidationError({
        title: "Time Limit",
        message: "Bookings cannot start before 6:00 AM.",
      });
      return;
    }
    if (endHour > LATEST_END_HOUR) {
      setValidationError({
        title: "Time Limit",
        message: "Bookings cannot end after 8:00 PM.",
      });
      return;
    }

    // Maintenance Check
    if (
      isSlotInMaintenance(newStart) ||
      isSlotInMaintenance(addMinutes(newEnd, -1))
    ) {
      setValidationError({
        title: "Asset Unavailable",
        message: "You cannot move a booking into a maintenance period.",
      });
      return;
    }

    setPendingReschedule({ event: eventData, newStart, newEnd });
  };

  const confirmReschedule = async () => {
    if (!pendingReschedule) return;
    setIsRescheduling(true);
    const { event, newStart, newEnd } = pendingReschedule;
    const originalEvents = [...events];
    const updatedEvents = events.map((ev) =>
      ev.id === event.id ? { ...ev, start: newStart, end: newEnd } : ev,
    );
    setEvents(updatedEvents);

    try {
      const bookingId =
        typeof event.bookingKey === "string" ? event.bookingKey : event.id;
      const originalPayload = isRecord(event._originalData)
        ? event._originalData
        : null;
      const bookingTitle =
        typeof event.bookingTitle === "string" ? event.bookingTitle : "";
      const bookingNotes =
        typeof event.bookingNotes === "string" ? event.bookingNotes : "";
      const payload = {
        booking_date: format(newStart, "yyyy-MM-dd"),
        start_time: format(newStart, "HH:mm:ss"),
        end_time: format(newEnd, "HH:mm:ss"),
        purpose:
          getString(originalPayload?.purpose) || bookingTitle || "Rescheduled",
        notes: getString(originalPayload?.notes) || bookingNotes || "",
      };
      await api.put(`/bookings/${bookingId}`, payload);
      effectiveOnActionComplete?.();
    } catch (error) {
      reportError(
        error,
        "CalendarViews: failed to reschedule booking via drag/drop",
      );
      setEvents(originalEvents);
      setValidationError({
        title: "Reschedule Failed",
        message: "Failed to reschedule the booking. Please try again.",
      });
    } finally {
      setIsRescheduling(false);
      setPendingReschedule(null);
    }
  };

  const handleActionRefresh = () => {
    effectiveOnActionComplete?.();
  };

  // --- GRID RENDER LOGIC ---
  const hours = [...Array(14)].map((_, i) => {
    const hourDate = new Date(date);
    hourDate.setHours(i + 6, 0, 0, 0); // Start at 6 AM
    return hourDate;
  });

  const handleTimeSlotClick = (hour: Date) => {
    if (isSlotInMaintenance(hour)) return;

    const startTime = new Date(hour);
    const endTime = addHours(startTime, 1);
    setSelectedTimeSlot({
      start: startTime,
      end: endTime,
      assetName: assetCalendar?.name,
    });
    setIsBookingFormOpen(true);
  };

  const currentHour = new Date().getHours();
  const isCurrentDay = isSameDay(date, new Date());

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-slate-100 relative">
          <div className="flex flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
            {/* Sidebar Hours */}
            <div className="w-14 flex-shrink-0 border-r border-slate-100 bg-slate-50 flex flex-col">
              {hours.map((hour) => (
                <div
                  key={hour.toString()}
                  className="h-12 flex-none flex items-start justify-end pr-2 pt-0.5 text-xs text-slate-400 font-medium border-t border-slate-100"
                >
                  {format(hour, "h a")}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 relative">
              {isCurrentDay && currentHour >= 6 && currentHour < 20 && (
                <div
                  className="absolute w-full border-t-2 border-[var(--navy)] z-20 pointer-events-none"
                  style={{ top: `${(currentHour - 6) * 48}px` }}
                >
                  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-[var(--navy)]"></div>
                </div>
              )}

              <div className="flex flex-col w-full h-full">
                {hours.map((hour, index) => {
                  const underMaintenance = isSlotInMaintenance(hour);

                  return (
                    <div
                      key={hour.toString()}
                      className={`
                            relative border-t border-slate-100 h-12 flex-none 
                            ${
                              underMaintenance
                                ? "bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.04)_25%,rgba(0,0,0,0.04)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.04)_75%,rgba(0,0,0,0.04)_100%)] bg-[length:16px_16px] bg-slate-50"
                                : index % 2 === 0
                                  ? "bg-white"
                                  : "bg-slate-50/30"
                            }
                        `}
                    >
                      {/* Interactive Layer */}
                      <div
                        className={`absolute inset-0 w-full h-full transition-colors 
                                ${
                                  underMaintenance
                                    ? "cursor-not-allowed z-30"
                                    : "cursor-pointer hover:bg-slate-100/60"
                                }`}
                        onClick={() => handleTimeSlotClick(hour)}
                      >
                        {underMaintenance && (
                          <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-full">
                              <Ban size={10} /> Maintenance
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="absolute w-full border-t border-slate-100 border-dashed top-1/2 pointer-events-none"></div>

                      <EventGroupSideBySide
                        hour={hour}
                        events={events || []}
                        isDisabled={underMaintenance}
                        onEventClick={(id) => setViewingEventId(id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {isBookingFormOpen && (
            <CreateBookingForm
              isOpen={isBookingFormOpen}
              onClose={() => setIsBookingFormOpen(false)}
              startTime={selectedTimeSlot.start}
              endTime={selectedTimeSlot.end}
              defaultAsset={assetCalendar?.id}
              defaultAssetName={assetCalendar?.name}
              onSave={(newEvents) => {
                effectiveOnBookingCreated?.(newEvents);
                setTimeout(() => {
                  effectiveOnActionComplete?.();
                }, 200);
              }}
            />
          )}
        </div>
      </DndContext>

      {/* Validation Error Dialog */}
      <AlertDialog
        open={!!validationError}
        onOpenChange={() => setValidationError(null)}
      >
        <AlertDialogContent className="w-[calc(100vw-1rem)] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              {validationError?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {validationError?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setValidationError(null)}
              className="w-full bg-[var(--navy)] text-white sm:w-auto"
            >
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drag Confirmation Modal */}
      <AlertDialog
        open={!!pendingReschedule}
        onOpenChange={(open) =>
          !open && !isRescheduling && setPendingReschedule(null)
        }
      >
        <AlertDialogContent className="w-[calc(100vw-1rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reschedule{" "}
              <strong>{pendingReschedule?.event.title}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-4 text-sm my-2 bg-slate-50 p-3 rounded-md border border-slate-100">
            <span className="font-medium text-slate-700 line-through">
              {pendingReschedule?.event.start &&
                format(pendingReschedule.event.start, "h:mm a")}
            </span>
            <span className="text-slate-400">→</span>
            <span className="font-bold text-[var(--navy)]">
              {pendingReschedule?.newStart &&
                format(pendingReschedule.newStart, "h:mm a")}
            </span>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isRescheduling}
              className="w-full sm:w-auto"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmReschedule();
              }}
              disabled={isRescheduling}
              className="w-full bg-[var(--navy)] text-white sm:w-auto"
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Confirm Change"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <BookingDetailsDialog
        isOpen={!!viewingEventId}
        bookingId={viewingEventId}
        onClose={() => setViewingEventId(null)}
        onActionComplete={handleActionRefresh}
      />
    </>
  );
};

export const CalendarWeekView = () => {
  const { view, date, locale, events, setEvents, onEventClick } = useCalendar();
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date | null;
    end: Date | null;
    dayIndex?: number;
  }>({
    start: null,
    end: null,
  });

  const weekDates = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      const hours = [...Array(16)].map((_, hourIndex) => {
        const hourDate = new Date(day);
        hourDate.setHours(hourIndex + 5, 0, 0, 0);
        return hourDate;
      });
      weekDates.push(hours);
    }

    return weekDates;
  }, [date]);

  const headerDays = useMemo(() => {
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      const result = addDays(startOfWeek(date, { weekStartsOn: 0 }), i);
      daysOfWeek.push(result);
    }
    return daysOfWeek;
  }, [date]);

  const handleTimeSlotClick = (hour: Date) => {
    const startTime = new Date(hour);
    const endTime = addHours(startTime, 1);

    setSelectedTimeSlot({
      start: startTime,
      end: endTime,
    });
    setIsBookingFormOpen(true);
  };

  const handleSaveEvent = (
    newEvent: Partial<CalendarEvent> | Partial<CalendarEvent>[],
  ) => {
    if (!setEvents || !events) return;

    if (Array.isArray(newEvent)) {
      const completeEvents: CalendarEvent[] = [];
      for (const event of newEvent) {
        const start = toDate(event.start);
        const title = typeof event.title === "string" ? event.title : "";
        if (!start || !title) continue;

        const end = toDate(event.end) || addHours(start, 1);
        completeEvents.push({
          ...event,
          id:
            typeof event.id === "string"
              ? event.id
              : Math.random().toString(36).substring(2, 11),
          start,
          end,
          title,
          description:
            typeof event.description === "string" ? event.description : "",
          color: isCalendarColor(event.color) ? event.color : "yellow",
        } as CalendarEvent);
      }

      setEvents([...events, ...completeEvents]);

      if (onEventClick && completeEvents.length > 0) {
        onEventClick(completeEvents[completeEvents.length - 1]);
      }
    } else {
      const start = toDate(newEvent.start);
      const title = typeof newEvent.title === "string" ? newEvent.title : "";

      if (start && title) {
        const end = toDate(newEvent.end) || addHours(start, 1);
        const completeEvent: CalendarEvent = {
          ...newEvent,
          id:
            typeof newEvent.id === "string"
              ? newEvent.id
              : Math.random().toString(36).substring(2, 11),
          start,
          end,
          title,
          description:
            typeof newEvent.description === "string"
              ? newEvent.description
              : "",
          color: isCalendarColor(newEvent.color) ? newEvent.color : "yellow",
        };

        setEvents([...events, completeEvent]);

        if (onEventClick) {
          onEventClick(completeEvent);
        }
      }
    }
  };

  if (view !== "week") return null;

  return (
    <div className="flex flex-col relative overflow-auto h-full bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="flex sticky top-0 bg-white z-10 border-b border-slate-100 mb-3 pt-3">
        <div className="w-12"></div>
        {headerDays.map((date, i) => (
          <div
            key={date.toString()}
            className={cn(
              "text-center flex-1 gap-1 pb-2 text-sm text-slate-500 font-medium flex items-center justify-center",
              [0, 6].includes(i) && "text-slate-400",
            )}
          >
            {format(date, "E", { locale })}
            <span
              className={cn(
                "h-6 w-6 ml-1 grid place-content-center rounded-full text-xs font-bold",
                isToday(date)
                  ? "bg-[var(--navy)] text-white"
                  : "text-slate-900",
              )}
            >
              {format(date, "d")}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-1">
        <div className="w-fit">
          <TimeTable />
        </div>
        <div className="grid grid-cols-7 flex-1 relative pr-4">
          {" "}
          <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
            {weekDates.map((hours, i) => {
              return (
                <div
                  className={cn(
                    "h-full text-sm text-slate-500 border-l border-slate-100 first:border-l-0",
                    [0, 6].includes(i) && "bg-slate-50/50",
                  )}
                  key={hours[0].toString()}
                >
                  {hours.map((hour) => (
                    <EventGroup
                      key={hour.toString()}
                      hour={hour}
                      events={events}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          <div className="absolute inset-0 grid grid-cols-7">
            {weekDates.map((hours, dayIndex) => (
              <div
                key={`clickable-${dayIndex}`}
                className={cn(
                  "grid grid-rows-[repeat(16,1fr)] h-full border-l border-slate-100 first:border-l-0",
                  [0, 6].includes(dayIndex) && "bg-slate-50/30",
                )}
              >
                {hours.map((hour) => (
                  <div
                    key={`slot-${hour.toString()}`}
                    className="border-t border-slate-100 last:border-b w-full h-full cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleTimeSlotClick(hour)}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isBookingFormOpen && (
        <CreateBookingForm
          isOpen={isBookingFormOpen}
          onClose={() => setIsBookingFormOpen(false)}
          startTime={selectedTimeSlot.start}
          endTime={selectedTimeSlot.end}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
};

export const CalendarMonthView = () => {
  const { date, view, events, locale, setDate } = useCalendar();

  const monthDates = useMemo(() => getDaysInMonth(date), [date]);
  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== "month") return null;

  const handleDateClick = (selectedDate: Date) => {
    setDate(selectedDate);
  };

  return (
    <div className="flex flex-col bg-white">
      <div className="grid grid-cols-7 gap-px sticky top-0 bg-white border-b border-slate-100 pb-2">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center text-xs font-bold uppercase tracking-wider text-slate-400",
              [0, 6].includes(i) && "text-slate-300",
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid -mt-px p-px grid-cols-7 gap-px bg-slate-100">
        {monthDates.map((_date) => {
          const currentEvents = events.filter((event) =>
            isSameDay(event.start, _date),
          );

          const isSelectedDate = isSameDay(_date, date);
          const isCurrentMonth = isSameMonth(date, _date);

          return (
            <div
              className={cn(
                "aspect-square bg-white relative p-2 text-sm ring-1 ring-slate-100 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col gap-1",
                !isCurrentMonth && "bg-slate-50/50 text-slate-300",
              )}
              key={_date.toString()}
              onClick={() => handleDateClick(_date)}
            >
              <span
                className={cn(
                  "size-7 grid place-items-center rounded-full text-xs font-medium mb-1",
                  isToday(_date)
                    ? "bg-[var(--navy)] text-white font-bold"
                    : isSelectedDate && !isToday(_date)
                      ? "bg-slate-200 text-slate-900"
                      : "text-slate-700",
                )}
              >
                {format(_date, "d")}
              </span>

              {/* Limit events shown in the mini calendar to avoid overflow */}
              {currentEvents.slice(0, 2).map((event) => {
                return (
                  <div
                    key={event.id}
                    className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium flex items-center gap-1 truncate border border-slate-100 bg-slate-50 text-slate-600"
                  >
                    <div
                      className={cn(
                        "shrink-0",
                        monthEventVariants({ variant: event.color }),
                      )}
                    ></div>
                    {/* Optional: Hide text on very small screens if needed */}
                    <span className="flex-1 truncate hidden xl:block">
                      {event.title}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CalendarYearView = () => {
  const { view, date, today, locale } = useCalendar();

  const months = useMemo(() => {
    if (!view) {
      return [];
    }

    return Array.from({ length: 12 }).map((_, i) => {
      return getDaysInMonth(setMonth(date, i));
    });
  }, [date, view]);

  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== "year") return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-auto h-full p-4">
      {months.map((days, i) => (
        <div
          key={days[0].toString()}
          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
        >
          <span className="text-lg font-bold text-slate-900 mb-4 block px-2">
            {format(setMonth(date, i), "MMMM")}
          </span>

          <div className="grid grid-cols-7 gap-2 my-3">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] uppercase font-bold text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid gap-x-2 gap-y-1 text-center grid-cols-7 text-xs tabular-nums">
            {days.map((_date: string | number | Date) => {
              const isCurrentMonth = getMonth(_date) === i;
              return (
                <div
                  key={_date.toString()}
                  className={cn(
                    !isCurrentMonth && "text-slate-200",
                    isCurrentMonth && "text-slate-600",
                  )}
                >
                  <div
                    className={cn(
                      "aspect-square grid place-content-center size-full rounded-md",
                      isSameDay(today, _date) &&
                        isCurrentMonth &&
                        "bg-[var(--navy)] text-white font-bold",
                    )}
                  >
                    {format(_date, "d")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export const EventGroup = ({
  events,
  hour,
}: {
  events: CalendarEvent[];
  hour: Date;
}) => {
  const filteredEvents = events.filter((event) =>
    isSameHour(event.start, hour),
  );

  if (filteredEvents.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 w-11/12 z-10">
      {filteredEvents.map((event, index) => {
        const hoursDifference =
          differenceInMinutes(event.end, event.start) / 60;
        const startPosition = event.start.getMinutes() / 60;

        const startTime = format(event.start, "h:mm a");
        const endTime = format(event.end, "h:mm a");

        return (
          <TooltipProvider key={`${event.id}-${index}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "absolute cursor-pointer shadow-sm hover:shadow-md transition-shadow",
                    dayEventVariants({ variant: event.color }),
                  )}
                  style={{
                    top: `${startPosition * 100}%`,
                    height: `${hoursDifference * 100}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {event.title}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[var(--navy)] text-white border-slate-700">
                <div className="flex flex-col gap-1">
                  <p className="font-bold">{event.title}</p>
                  <p className="text-xs text-slate-300">
                    {startTime} - {endTime}
                  </p>
                  <p className="text-xs text-slate-400">{event.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

const EventGroupSideBySide = ({
  hour,
  events,
  isDisabled,
  onEventClick,
}: {
  hour: Date;
  events: CalendarEvent[];
  isDisabled?: boolean;
  onEventClick: (id: string) => void;
}) => {
  const eventsInHour = events.filter((event) => isSameHour(event.start, hour));
  if (eventsInHour.length === 0) return null;

  const RESERVED_RIGHT_GAP_PERCENT = 18;
  const PENDING_LANE_WIDTH_PERCENT = 100 - RESERVED_RIGHT_GAP_PERCENT;

  const isPendingEvent = (event: CalendarEvent) => {
    const eventStatus = (event.bookingStatus || event.status || "")
      .toString()
      .toLowerCase();
    return eventStatus === "pending";
  };

  const pendingEvents = eventsInHour.filter(isPendingEvent);
  const pendingCount = pendingEvents.length;
  const shouldCollapsePending = pendingCount >= 4;
  const pendingWidthPercent =
    pendingCount > 0
      ? Math.max(25, PENDING_LANE_WIDTH_PERCENT / pendingCount)
      : PENDING_LANE_WIDTH_PERCENT;

  return (
    <div className="absolute inset-0 flex w-full h-full pointer-events-none">
      {eventsInHour.map((event, index) => {
        const minutesOffset = event.start.getMinutes();
        const durationMinutes = differenceInMinutes(event.end, event.start);
        const hoursSpan = Math.ceil(durationMinutes / 60);
        const pendingIndex = pendingEvents.findIndex(
          (pending) => pending.id === event.id,
        );
        const isPending = pendingIndex !== -1;

        if (shouldCollapsePending && isPending && pendingIndex > 0) {
          return null;
        }

        const isCollapsedPendingSummary =
          shouldCollapsePending && isPending && pendingIndex === 0;

        const heightVal =
          hoursSpan > 1
            ? `${100 - (minutesOffset / 60) * 100 + (hoursSpan - 1) * 100}%`
            : `${Math.max((durationMinutes / 60) * 100, 10)}%`;

        const width = isPending
          ? shouldCollapsePending
            ? PENDING_LANE_WIDTH_PERCENT
            : pendingWidthPercent
          : pendingCount > 0
            ? PENDING_LANE_WIDTH_PERCENT
            : 100;
        const left = isPending
          ? shouldCollapsePending
            ? 0
            : pendingIndex * pendingWidthPercent
          : 0;
        const top = isCollapsedPendingSummary
          ? "0%"
          : `${(minutesOffset / 60) * 100}%`;
        const height = isCollapsedPendingSummary ? "100%" : heightVal;
        const eventTitle = isCollapsedPendingSummary
          ? `${pendingCount} pending requests`
          : event.title;
        const tooltipTitle = isCollapsedPendingSummary
          ? `${pendingCount} pending requests for this slot`
          : event.title;
        const isYourBooking = Boolean(
          event.isBookedByMe || event.isAssignedToMe,
        );
        const durationLabel =
          durationMinutes > 0 ? `${durationMinutes} min` : "Unknown";
        const eventStatus =
          typeof event.bookingStatus === "string" && event.bookingStatus
            ? event.bookingStatus
            : typeof event.status === "string" && event.status
              ? event.status
              : "unknown";
        const eventAsset =
          typeof event.assetName === "string" && event.assetName
            ? event.assetName
            : "Unknown asset";
        const eventBookedFor =
          typeof event.bookingFor === "string" ? event.bookingFor : "";
        const eventNotes =
          typeof event.description === "string" && event.description.trim()
            ? event.description
            : typeof event.bookingDescription === "string" &&
                event.bookingDescription.trim()
              ? event.bookingDescription
              : "";

        return (
          <div
            key={event.id}
            className="absolute pointer-events-auto"
            style={{
              top,
              height,
              width: `${width}%`,
              left: `${left}%`,
              zIndex: isCollapsedPendingSummary ? 12 : 10,
            }}
          >
            {/* 4. Pass isDisabled to wrapper to disable drag */}
            <DraggableEventWrapper
              event={event}
              disabled={isDisabled || isCollapsedPendingSummary}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        dayEventVariants({ variant: event.color }),
                        "relative w-full h-full hover:shadow-md transition-all",
                        isDisabled
                          ? "cursor-not-allowed opacity-75 grayscale"
                          : isCollapsedPendingSummary
                            ? "cursor-default"
                            : "cursor-pointer",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCollapsedPendingSummary) return;
                        // We ALLOW clicking to view details even in maintenance (to see what the booking is)
                        // But editing/rescheduling is disabled via the dialog's logic if needed (or here)
                        const bookingId =
                          typeof event.bookingKey === "string"
                            ? event.bookingKey
                            : event.id;
                        onEventClick(bookingId);
                      }}
                    >
                      {isYourBooking && (
                        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-slate-700" />
                      )}
                      <div className="font-bold truncate">{eventTitle}</div>
                      {!isCollapsedPendingSummary && durationMinutes >= 20 && (
                        <div className="text-[10px] opacity-80 mt-0.5 font-medium">
                          {format(event.start, "h:mm a")} -{" "}
                          {format(event.end, "h:mm a")}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[var(--navy)] text-white border-slate-700 z-[1000]">
                    <div className="max-w-[260px] space-y-1">
                      <div className="font-bold">{tooltipTitle}</div>
                      {!isCollapsedPendingSummary && (
                        <>
                          <div className="text-xs text-slate-300">
                            {format(event.start, "h:mm a")} -{" "}
                            {format(event.end, "h:mm a")}
                          </div>
                          <div className="text-xs text-slate-300 capitalize">
                            Status:{" "}
                            <span className="text-white">{eventStatus}</span>
                          </div>
                          <div className="text-xs text-slate-300">
                            Asset:{" "}
                            <span className="text-white">{eventAsset}</span>
                          </div>
                          {eventBookedFor && (
                            <div className="text-xs text-slate-300">
                              Booked by:{" "}
                              <span className="text-white">
                                {eventBookedFor}
                              </span>
                            </div>
                          )}
                          <div className="text-xs text-slate-300">
                            Duration:{" "}
                            <span className="text-white">{durationLabel}</span>
                          </div>
                          {eventNotes && (
                            <div className="text-xs text-slate-300 line-clamp-2">
                              Notes:{" "}
                              <span className="text-white">{eventNotes}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DraggableEventWrapper>
          </div>
        );
      })}
    </div>
  );
};
