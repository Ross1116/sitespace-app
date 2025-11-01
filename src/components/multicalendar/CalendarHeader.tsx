import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  CalendarCurrentDate,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarNextTrigger,
} from "@/components/ui/full-calendar/index";
import { AssetCalendar } from "@/lib/multicalendarHelpers";

interface CalendarHeaderProps {
  isCollapsed: boolean;
  loading: boolean;
  assetCalendars: AssetCalendar[];
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  selectedAssetIndex: number;
  setSelectedAssetIndex: React.Dispatch<React.SetStateAction<number>>;
  onRefresh?: () => void;
  error?: string | null;
}

export function CalendarHeader({
  isCollapsed,
  loading,
  assetCalendars,
  setIsCollapsed,
  selectedAssetIndex,
  setSelectedAssetIndex,
  onRefresh,
  error,
}: CalendarHeaderProps) {
  return (
    <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {/* Collapsible button - only visible on non-mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex items-center justify-center h-8 w-8"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <span className="sr-only">
            {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </Button>

        {/* Refresh button */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 flex items-center justify-center"
            title="Refresh bookings"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="sr-only">Refresh</span>
          </Button>
        )}

        {/* Error indicator */}
        {error && !loading && (
          <div className="flex items-center gap-1 text-red-600 text-sm" title={error}>
            <AlertCircle size={16} />
            <span className="hidden sm:inline">Error loading</span>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span className="hidden sm:inline">Loading...</span>
          </div>
        )}
      </div>

      <div className="flex justify-evenly mx-auto md:justify-end md:mr-0 items-center space-x-4">
        {/* Mobile asset selector */}
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
              {assetCalendars.length === 0 ? (
                <SelectItem value="-1" disabled>
                  No assets
                </SelectItem>
              ) : (
                assetCalendars.map((calendar, index) => (
                  <SelectItem key={calendar.id || index} value={index.toString()}>
                    {calendar.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Date navigation */}
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