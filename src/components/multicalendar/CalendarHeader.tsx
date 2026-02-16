import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarNextTrigger,
  CalendarMonthView,
  useCalendar,
} from "@/components/ui/full-calendar/index";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const { date, setDate } = useCalendar();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
          <div
            className="flex items-center gap-1 text-red-600 text-sm"
            title={error}
          >
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
      <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:justify-end">
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
                  <SelectItem
                    key={calendar.id || index}
                    value={index.toString()}
                  >
                    {calendar.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Date Navigation Group */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          <CalendarCurrentDate className="md:text-lg text-sm font-bold text-slate-900" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Today Button - Distinct White Pill */}
            <CalendarTodayTrigger className="h-8 bg-white border border-slate-200 shadow-sm rounded-md px-2.5 sm:px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all">
              Today
            </CalendarTodayTrigger>

            {/* Arrows Group - Connected */}
            <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-md h-8 shrink-0">
              <CalendarPrevTrigger className="h-full w-8 sm:w-9 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-l-md rounded-r-none border-r border-slate-100 transition-colors">
                <ChevronLeft size={16} />
                <span className="sr-only">Previous</span>
              </CalendarPrevTrigger>
              <Popover
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-full w-8 sm:w-9 rounded-none border-r border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-50 xl:hidden"
                    title="Jump to date"
                  >
                    <CalendarDays size={14} />
                    <span className="sr-only">Jump to date</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  className="w-[280px] p-2 border-slate-200"
                >
                  <Calendar
                    date={date}
                    onDateChange={setDate}
                    view="month"
                    events={[]}
                  >
                    <div className="w-full min-w-[240px]">
                      <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                        <CalendarCurrentDate className="text-sm font-bold text-slate-900" />
                        <div className="flex items-center bg-white border border-slate-200 rounded-md h-7">
                          <CalendarPrevTrigger className="h-full w-7 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-l-md rounded-r-none border-r border-slate-100 transition-colors">
                            <ChevronLeft size={12} />
                          </CalendarPrevTrigger>
                          <CalendarNextTrigger className="h-full w-7 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-r-md rounded-l-none transition-colors">
                            <ChevronRight size={12} />
                          </CalendarNextTrigger>
                        </div>
                      </div>
                      <div
                        onClick={() => setIsDatePickerOpen(false)}
                        className="cursor-pointer"
                      >
                        <CalendarMonthView />
                      </div>
                    </div>
                  </Calendar>
                </PopoverContent>
              </Popover>
              <CalendarNextTrigger className="h-full w-8 sm:w-9 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-r-md rounded-l-none transition-colors">
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
