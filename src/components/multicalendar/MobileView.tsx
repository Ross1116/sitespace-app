import { Calendar, CalendarDayView } from "@/components/ui/full-calendar/index";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetCalendar } from "@/lib/multicalendarHelpers";

interface MobileViewProps {
  loading: boolean;
  selectedCalendar: AssetCalendar;
  currentDate: Date;
}

export function MobileView({
  loading,
  selectedCalendar,
  currentDate,
}: MobileViewProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="border border-slate-200 rounded-xl flex flex-col h-full min-h-96 overflow-hidden bg-white shadow-sm">
        <div className="p-3 bg-[var(--navy)] text-white font-semibold flex items-center justify-between">
          {loading ? (
            <Skeleton className="h-6 w-40 bg-slate-700" />
          ) : (
            <span className="truncate">{selectedCalendar.name}</span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full bg-slate-100" />
              ))}
            </div>
          ) : (
            <Calendar
              key={`mobile-calendar-${selectedCalendar.id}`}
              events={selectedCalendar.events}
              view="day"
              date={currentDate}
            >
              <CalendarDayView assetCalendar={selectedCalendar} />
            </Calendar>
          )}
        </div>
      </div>
    </div>
  );
}
