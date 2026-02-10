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
    <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
      {/* Left Side: Controls & Indicators */}
      <div className="flex items-center gap-2">
        {/* Collapsible button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex items-center justify-center h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
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
            className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100"
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
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-3.5 h-3.5 border-2 border-[var(--navy)] border-t-transparent rounded-full animate-spin" />
            <span className="hidden sm:inline font-medium">Loading...</span>
          </div>
        )}
      </div>

      {/* Right Side: Navigation & Filters */}
      <div className="flex justify-evenly mx-auto md:justify-end md:mr-0 items-center space-x-4">
        
        {/* Mobile Asset Selector */}
        <div className="flex items-center gap-2 md:hidden">
          <Select
            value={selectedAssetIndex.toString()}
            onValueChange={(value: string) =>
              setSelectedAssetIndex(parseInt(value))
            }
            disabled={loading || assetCalendars.length === 0}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-slate-200 shadow-sm">
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

        {/* Date Navigation Group */}
        <div className="flex items-center gap-3">
          <CalendarCurrentDate className="md:text-lg text-sm font-bold text-slate-900 min-w-[120px] text-right" />
          
          <div className="flex items-center gap-2">
            {/* Today Button - Distinct White Pill */}
            <CalendarTodayTrigger className="h-8 bg-white border border-slate-200 shadow-sm rounded-md px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all">
              Today
            </CalendarTodayTrigger>

            {/* Arrows Group - Connected */}
            <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-md h-8">
              <CalendarPrevTrigger className="h-full w-9 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-l-md rounded-r-none border-r border-slate-100 transition-colors">
                <ChevronLeft size={16} />
                <span className="sr-only">Previous</span>
              </CalendarPrevTrigger>
              <CalendarNextTrigger className="h-full w-9 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-r-md rounded-l-none transition-colors">
                <ChevronRight size={16} />
                <span className="sr-only">Next</span>
              </CalendarNextTrigger>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
