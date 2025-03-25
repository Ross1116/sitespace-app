import { Calendar, CalendarDayView } from "@/components/ui/full-calendar/index";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetCalendar } from "@/lib/multicalendarHelpers";

interface MobileViewProps {
  loading: boolean;
  selectedCalendar: AssetCalendar;
  currentDate: Date;
  onActionComplete?: () => void;
}

export function MobileView({ 
  loading, 
  selectedCalendar, 
  currentDate,
  onActionComplete 
}: MobileViewProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="border rounded-md flex flex-col h-full min-h-96 overflow-hidden">
        <div className="p-3 bg-orange-200 font-medium">
          {loading ? <Skeleton className="h-6 w-40" /> : selectedCalendar.name}
        </div>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Calendar
              key={`mobile-calendar`}
              events={selectedCalendar.events}
              view="day"
              date={currentDate}
            >
              <CalendarDayView assetCalendar={selectedCalendar} onActionComplete={onActionComplete}/>
            </Calendar>
          )}
        </div>
      </div>
    </div>
  );
}