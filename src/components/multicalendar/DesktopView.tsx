import { Calendar, CalendarDayView } from "@/components/ui/full-calendar/index";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetCalendar } from "@/lib/multicalendarHelpers";
import { format } from "date-fns";

interface DesktopViewProps {
  loading: boolean;
  isCollapsed: boolean;
  assetCalendars: AssetCalendar[];
  visibleAssets: number[];
  currentDate: Date;
  onActionComplete?: () => void;
}

export function DesktopView({
  loading,
  isCollapsed,
  assetCalendars,
  visibleAssets,
  currentDate,
  onActionComplete,
}: DesktopViewProps) {
  return (
    <div
      className={`grid ${isCollapsed
        ? "grid-cols-2 lg:grid-cols-5 xl:grid-cols-6"
        : "grid-cols-2 lg:grid-cols-4"
        } flex-1 gap-1 overflow-visible`}
    >
      {loading ? (
        // Create multiple skeleton placeholders in a grid
        Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col h-full bg-stone-100 rounded-lg shadow-sm overflow-hidden mb-1"
          >
            <div className="px-4 py-2 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-center">
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3 w-8" />
            </div>
            <div className="flex flex-1 relative">
              <div className="w-14 flex-shrink-0 border-r border-gray-200 bg-gray-50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 flex items-start justify-end pr-2 pt-0.5">
                    <Skeleton className="h-3 w-6" />
                  </div>
                ))}
              </div>
              <div className="flex-1 relative">
                <div className="grid grid-rows-[repeat(4,minmax(3rem,1fr))] w-full h-full">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`relative border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <Skeleton className="h-8 w-3/4 m-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : assetCalendars.length === 0 ? (
        <div className="col-span-full flex items-center justify-center h-64">
          <p>No bookings found</p>
        </div>
      ) : (
        assetCalendars
          .filter((_, index) => visibleAssets.includes(index))
          .map((calendar, index) => (
            <div
              key={calendar.id || index}
              className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden mb-1"
            >
              <div className="px-4 py-2 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {format(currentDate, "EEE, MMM d")}
                  </h2>
                  {calendar.name && (
                    <p className="text-xs text-gray-500">{calendar.name}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {format(currentDate, "yyyy")}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <Calendar
                  key={`desktop-calendar-${calendar.id || index}`}
                  events={calendar.events}
                  view="day"
                  date={currentDate}
                >
                  <CalendarDayView
                    assetCalendar={calendar}
                    onActionComplete={onActionComplete}
                  />
                </Calendar>
              </div>
            </div>
          ))
      )}
    </div>
  );
}
