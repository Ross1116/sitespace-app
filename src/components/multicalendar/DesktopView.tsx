import { Calendar, CalendarDayView } from "@/components/ui/full-calendar/index";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetCalendar, CalendarEvent } from "@/lib/multicalendarHelpers";
import { format } from "date-fns";

interface DesktopViewProps {
  loading: boolean;
  isCollapsed: boolean;
  assetCalendars: AssetCalendar[];
  visibleAssets: number[];
  currentDate: Date;
  onActionComplete?: () => void;
  onBookingCreated?: (
    newEvents: Partial<CalendarEvent> | Partial<CalendarEvent>[]
  ) => void;
}

export function DesktopView({
  loading,
  isCollapsed,
  assetCalendars,
  visibleAssets,
  currentDate,
  onActionComplete,
  onBookingCreated,
}: DesktopViewProps) {
  return (
    <div
      className={`grid ${
        isCollapsed
          ? "grid-cols-2 lg:grid-cols-5 xl:grid-cols-6"
          : "grid-cols-2 lg:grid-cols-4"
      } flex-1 gap-3 overflow-visible`} // Increased gap for better separation on gray bg
    >
      {loading ? (
        // Create multiple skeleton placeholders
        Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
          >
            <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10 flex justify-between items-center">
              <div>
                <Skeleton className="h-5 w-24 mb-1 bg-slate-100" />
                <Skeleton className="h-3 w-16 bg-slate-50" />
              </div>
              <Skeleton className="h-3 w-8 bg-slate-50" />
            </div>
            <div className="flex flex-1 relative">
              <div className="w-14 flex-shrink-0 border-r border-slate-100 bg-slate-50/50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 flex items-start justify-end pr-2 pt-0.5"
                  >
                    <Skeleton className="h-3 w-6 bg-slate-200" />
                  </div>
                ))}
              </div>
              <div className="flex-1 relative bg-white">
                <div className="grid grid-rows-[repeat(4,minmax(3rem,1fr))] w-full h-full">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`relative border-t border-slate-50 ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                      }`}
                    >
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : assetCalendars.length === 0 ? (
        <div className="col-span-full flex items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
          <p className="text-slate-500 font-medium">No bookings found</p>
        </div>
      ) : (
        assetCalendars
          .filter((_, index) => visibleAssets.includes(index))
          .map((calendar, index) => (
            <div
              key={calendar.id || index}
              className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="px-3 py-3 border-b border-slate-100 bg-white sticky top-0 z-10 flex justify-between items-center h-14">
                <div className="overflow-hidden">
                  {calendar.name && (
                    <h2 className="text-sm font-bold text-slate-800 truncate leading-tight" title={calendar.name}>
                      {calendar.name}
                    </h2>
                  )}
                  <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mt-0.5">
                    {format(currentDate, "EEE, MMM d")}
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <Calendar
                  key={`desktop-calendar-${calendar.id || index}`}
                  events={calendar.events}
                  view="day"
                  date={currentDate}
                >
                  <CalendarDayView
                    assetCalendar={calendar}
                    onActionComplete={onActionComplete}
                    onBookingCreated={onBookingCreated}
                  />
                </Calendar>
              </div>
            </div>
          ))
      )}
    </div>
  );
}