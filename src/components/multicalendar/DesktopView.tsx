import { Calendar, CalendarDayView } from "@/components/ui/full-calendar/index";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetCalendar } from "@/lib/multicalendarHelpers";

interface DesktopViewProps {
  loading: boolean;
  isCollapsed: boolean;
  assetCalendars: AssetCalendar[];
  visibleAssets: number[];
  currentDate: Date;
}

export function DesktopView({ 
  loading, 
  isCollapsed, 
  assetCalendars, 
  visibleAssets, 
  currentDate 
}: DesktopViewProps) {
  return (
    <div
      className={`grid ${
        isCollapsed
          ? "grid-cols-2 lg:grid-cols-5 xl:grid-cols-6"
          : "grid-cols-2 lg:grid-cols-4"
      } flex-1 gap-1 overflow-visible`}
    >
      {loading ? (
        // Create multiple skeleton placeholders in a grid
        Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="border rounded-md flex flex-col h-fit overflow-hidden mb-1"
          >
            <div className="p-3 bg-orange-200 font-medium border-b">
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
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
              className="border rounded-md flex flex-col h-fit overflow-hidden mb-1"
            >
              <div className="p-3 bg-orange-200 font-medium border-b">
                {calendar.name}
              </div>
              <div className="flex-1 overflow-hidden">
                <Calendar
                  key={`desktop-calendar-${calendar.id || index}`}
                  events={calendar.events}
                  view="day"
                  date={currentDate}
                >
                  <CalendarDayView assetCalendar={calendar} />
                </Calendar>
              </div>
            </div>
          ))
      )}
    </div>
  );
}