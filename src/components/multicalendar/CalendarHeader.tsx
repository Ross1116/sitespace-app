import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Button 
} from "@/components/ui/button";
import { 
  CalendarCurrentDate, 
  CalendarPrevTrigger, 
  CalendarTodayTrigger, 
  CalendarNextTrigger 
} from "@/components/ui/full-calendar/index";
import { AssetCalendar } from "@/lib/multicalendarHelpers";

interface CalendarHeaderProps {
  isCollapsed: boolean;
  loading: boolean;
  assetCalendars: AssetCalendar[];
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  selectedAssetIndex: number;
  setSelectedAssetIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function CalendarHeader({
  isCollapsed,
  loading,
  assetCalendars,
  setIsCollapsed,
  selectedAssetIndex,
  setSelectedAssetIndex
}: CalendarHeaderProps) {
  return (
    <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Collapsible button - only visible on non-mobile */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex items-center justify-center h-8 w-8 mr-2"
      >
        {isCollapsed ? (
          <ChevronRight size={16} />
        ) : (
          <ChevronLeft size={16} />
        )}
        <span className="sr-only">
          {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        </span>
      </Button>
      <div className="flex justify-evenly mx-auto md:justify-end md:mr-0 items-center space-x-4">
        <div className="flex items-center gap-2 md:hidden">
          <Select
            value={selectedAssetIndex.toString()}
            onValueChange={(value: string) =>
              setSelectedAssetIndex(parseInt(value))
            }
            disabled={loading || assetCalendars.length === 0}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent>
              {assetCalendars.map((calendar, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {calendar.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CalendarCurrentDate className="md:text-base text-sm" />
        <div className="flex items-center md:space-x-2 space-x-1">
          <CalendarPrevTrigger className="w-8 md:w-10">
            <ChevronLeft size={10} />
            <span className="sr-only">Previous</span>
          </CalendarPrevTrigger>
          <CalendarTodayTrigger className="px-2 md:px-5">
            Today
          </CalendarTodayTrigger>
          <CalendarNextTrigger className="w-8 md:w-10">
            <ChevronRight size={10} />
            <span className="sr-only">Next</span>
          </CalendarNextTrigger>
        </div>
      </div>
    </div>
  );
}