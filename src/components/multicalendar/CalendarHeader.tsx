import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { AssetCalendar } from "@/lib/multicalendarHelpers";

interface CalendarHeaderProps {
  isCollapsed: boolean;
  loading: boolean;
  assetCalendars: AssetCalendar[];
  visibleAssets: number[];
  setVisibleAssets: React.Dispatch<React.SetStateAction<number[]>>;
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
  visibleAssets,
  setVisibleAssets,
  setIsCollapsed,
  selectedAssetIndex,
  setSelectedAssetIndex,
  onRefresh,
  error,
}: CalendarHeaderProps) {
  const { date, setDate } = useCalendar();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAssetFilterOpen, setIsAssetFilterOpen] = useState(false);
  const [isRefreshAnimating, setIsRefreshAnimating] = useState(false);
  const allAssetIndices = useMemo(
    () => assetCalendars.map((_, index) => index),
    [assetCalendars],
  );

  const handleRefreshClick = () => {
    if (!onRefresh) return;
    setIsRefreshAnimating(true);
    onRefresh();
    setTimeout(() => setIsRefreshAnimating(false), 800);
  };

  const toggleVisibleAsset = (index: number) => {
    setVisibleAssets((prev) => {
      if (prev.includes(index)) {
        if (prev.length <= 1) return prev;
        const next = prev.filter((value) => value !== index);
        if (!next.includes(selectedAssetIndex)) {
          setSelectedAssetIndex(next[0]);
        }
        return next;
      }

      const next = [...prev, index].sort((a, b) => a - b);
      return next;
    });
  };

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
            onClick={handleRefreshClick}
            disabled={loading}
            className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="Refresh bookings"
          >
            <RefreshCw
              size={16}
              className={loading || isRefreshAnimating ? "animate-spin" : ""}
            />
            <span className="sr-only">Refresh</span>
          </Button>
        )}

        {/* Multi-asset filter for md-xl when sidebar filter is hidden */}
        <div className="hidden md:flex items-center gap-2 xl:hidden">
          <Popover open={isAssetFilterOpen} onOpenChange={setIsAssetFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs bg-white border-slate-200 shadow-sm text-slate-700"
                disabled={loading || assetCalendars.length === 0}
              >
                <SlidersHorizontal size={14} className="mr-1.5" />
                Assets ({visibleAssets.length}/{assetCalendars.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[250px] max-w-[calc(100vw-1rem)] p-2 border-slate-200"
            >
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">
                  Visible assets
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setVisibleAssets(allAssetIndices)}
                >
                  Show all
                </Button>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {assetCalendars.map((calendar, index) => (
                  <label
                    key={calendar.id || index}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={visibleAssets.includes(index)}
                      onCheckedChange={() => toggleVisibleAsset(index)}
                    />
                    <span className="text-xs text-slate-700 truncate">
                      {calendar.name}
                    </span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

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
        {/* Single-asset selector for mobile (single column) */}
        <div className="flex md:hidden items-center gap-2">
          <Select
            value={selectedAssetIndex.toString()}
            onValueChange={(value: string) => {
              const index = parseInt(value);
              if (Number.isNaN(index)) return;
              setSelectedAssetIndex(index);
              setVisibleAssets([index]);
            }}
            disabled={loading || assetCalendars.length === 0}
          >
            <SelectTrigger className="h-8 w-full max-w-[170px] text-xs bg-white border-slate-200 shadow-sm">
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
                  className="w-[280px] max-w-[calc(100vw-1rem)] p-2 border-slate-200"
                >
                  <Calendar
                    date={date}
                    onDateChange={setDate}
                    view="month"
                    events={[]}
                  >
                    <div className="w-full min-w-0">
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
