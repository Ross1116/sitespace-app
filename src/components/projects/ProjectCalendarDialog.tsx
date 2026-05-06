"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import { CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AU_HOLIDAY_REGIONS,
  deleteProjectNonWorkingDay,
  fetchProject,
  fetchProjectNonWorkingDays,
  updateProjectCalendar,
  upsertProjectNonWorkingDay,
  type ProjectNonWorkingDayPayload,
} from "@/hooks/projects/api";
import { reportError } from "@/lib/monitoring";
import type { ApiProject, ProjectNonWorkingDay } from "@/types";
import { getApiErrorMessage } from "@/types";

const DEFAULT_START = "08:00";
const DEFAULT_END = "16:00";

function normalizeTime(value?: string | null): string {
  return (value || "").slice(0, 5) || "";
}

function formatDay(value: string): string {
  try {
    return format(parseISO(value), "d MMM yyyy");
  } catch {
    return value;
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  project?: ApiProject | null;
  onSaved?: () => void;
}

export function ProjectCalendarDialog({
  open,
  onOpenChange,
  projectId,
  project,
  onSaved,
}: Props) {
  const [loadedProject, setLoadedProject] = useState<ApiProject | null>(null);
  const [days, setDays] = useState<ProjectNonWorkingDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workStart, setWorkStart] = useState(DEFAULT_START);
  const [workEnd, setWorkEnd] = useState(DEFAULT_END);
  const [region, setRegion] = useState("SA");
  const [source, setSource] = useState<"default" | "location" | "manual">("default");
  const [closureDate, setClosureDate] = useState("");
  const [closureLabel, setClosureLabel] = useState("");
  const [closureKind, setClosureKind] =
    useState<ProjectNonWorkingDayPayload["kind"]>("shutdown");

  const effectiveProject = loadedProject ?? project ?? null;
  const dateRange = useMemo(() => {
    const today = new Date();
    return {
      from: format(today, "yyyy-MM-dd"),
      to: format(addMonths(today, 12), "yyyy-MM-dd"),
    };
  }, []);

  const loadCalendar = useCallback(async () => {
    if (!projectId || !open) return;
    setLoading(true);
    setError(null);
    try {
      const [projectDetail, calendarDays] = await Promise.all([
        fetchProject(projectId),
        fetchProjectNonWorkingDays({
          projectId,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          includeRegional: true,
          includeRdo: true,
        }),
      ]);
      setLoadedProject(projectDetail);
      setDays(calendarDays);
      setWorkStart(normalizeTime(projectDetail.default_work_start_time) || DEFAULT_START);
      setWorkEnd(normalizeTime(projectDetail.default_work_end_time) || DEFAULT_END);
      setRegion((projectDetail.holiday_region_code || "SA").toUpperCase());
      setSource(
        projectDetail.holiday_region_source === "manual" ||
          projectDetail.holiday_region_source === "location"
          ? projectDetail.holiday_region_source
          : "default",
      );
    } catch (err) {
      reportError(err, "ProjectCalendarDialog: failed to load project calendar");
      setError(getApiErrorMessage(err, "Failed to load project calendar"));
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, open, projectId]);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  const manualDays = days.filter((day) => day.source === "manual");
  const regionalDays = days.filter((day) => day.source !== "manual");

  async function handleSaveSettings() {
    if (!projectId) return;
    if (!workStart || !workEnd || workEnd <= workStart) {
      setError("Working hours need a start time before the end time.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProjectCalendar(projectId, {
        default_work_start_time: `${workStart}:00`,
        default_work_end_time: `${workEnd}:00`,
        holiday_country_code: "AU",
        holiday_region_code: region as (typeof AU_HOLIDAY_REGIONS)[number],
        holiday_region_source: source === "manual" ? "manual" : source,
      });
      setLoadedProject(updated);
      onSaved?.();
      await loadCalendar();
    } catch (err) {
      reportError(err, "ProjectCalendarDialog: failed to save settings");
      setError(getApiErrorMessage(err, "Failed to save project calendar"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddClosure() {
    if (!projectId) return;
    const label = closureLabel.trim();
    if (!closureDate || !label) {
      setError("Choose a date and label for the closure.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertProjectNonWorkingDay(projectId, closureDate, {
        label,
        kind: closureKind,
      });
      setClosureDate("");
      setClosureLabel("");
      await loadCalendar();
      onSaved?.();
    } catch (err) {
      reportError(err, "ProjectCalendarDialog: failed to save closure");
      setError(getApiErrorMessage(err, "Failed to save closure"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteClosure(day: ProjectNonWorkingDay) {
    if (!projectId || day.source !== "manual") return;
    setSaving(true);
    setError(null);
    try {
      await deleteProjectNonWorkingDay(projectId, day.calendar_date);
      await loadCalendar();
      onSaved?.();
    } catch (err) {
      reportError(err, "ProjectCalendarDialog: failed to delete closure");
      setError(getApiErrorMessage(err, "Failed to delete closure"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1rem)] max-w-4xl flex-col overflow-hidden bg-white p-0">
        <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-teal-700" />
            Project working calendar
          </DialogTitle>
          <DialogDescription>
            Configure working hours, regional holidays, advisory RDOs, and manual non-working days.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-700">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex min-h-60 items-center justify-center text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading calendar...
            </div>
          ) : (
            <>
              <section className="grid gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {effectiveProject?.name ?? "Selected project"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {effectiveProject?.location || "No project location set"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">AU holidays</Badge>
                    <Badge variant="outline">
                      {region} from {source}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="project-work-start">Work starts</Label>
                    <Input
                      id="project-work-start"
                      type="time"
                      value={workStart}
                      onChange={(event) => setWorkStart(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="project-work-end">Work ends</Label>
                    <Input
                      id="project-work-end"
                      type="time"
                      value={workEnd}
                      onChange={(event) => setWorkEnd(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Holiday region</Label>
                    <Select
                      value={region}
                      onValueChange={(value) => {
                        setRegion(value);
                        setSource("manual");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AU_HOLIDAY_REGIONS.map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Region source</Label>
                    <Select
                      value={source}
                      onValueChange={(value) =>
                        setSource(value as "default" | "location" | "manual")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Adelaide/SA</SelectItem>
                        <SelectItem value="location">Infer from location</SelectItem>
                        <SelectItem value="manual">Manual override</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="space-y-1.5 md:w-44">
                    <Label htmlFor="closure-date">Closure date</Label>
                    <Input
                      id="closure-date"
                      type="date"
                      value={closureDate}
                      onChange={(event) => setClosureDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 md:w-44">
                    <Label>Kind</Label>
                    <Select
                      value={closureKind}
                      onValueChange={(value) =>
                        setClosureKind(value as ProjectNonWorkingDayPayload["kind"])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shutdown">Shutdown</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="rdo">RDO</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor="closure-label">Label</Label>
                    <Input
                      id="closure-label"
                      value={closureLabel}
                      onChange={(event) => setClosureLabel(event.target.value)}
                      placeholder="Site shutdown"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddClosure}
                    disabled={saving}
                    className="bg-navy text-white hover:bg-(--navy-hover)"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Manual closures
                  </h3>
                  <div className="mt-3 space-y-2">
                    {manualDays.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No manual closures in the next 12 months.
                      </p>
                    ) : (
                      manualDays.map((day) => (
                        <div
                          key={day.calendar_date}
                          className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {day.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDay(day.calendar_date)} · {day.kind}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            aria-label={`Delete ${day.label}`}
                            disabled={saving}
                            onClick={() => void handleDeleteClosure(day)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Regional holidays & RDOs
                  </h3>
                  <div className="mt-3 space-y-2">
                    {regionalDays.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No regional holidays or RDOs returned for this range.
                      </p>
                    ) : (
                      regionalDays.slice(0, 8).map((day) => (
                        <div
                          key={`${day.source}-${day.calendar_date}-${day.label}`}
                          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                        >
                          <p className="font-medium text-slate-900">{day.label}</p>
                          <p className="text-xs text-slate-500">
                            {formatDay(day.calendar_date)} · {day.kind} · {day.source}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={saving || loading || !projectId}
            className="bg-navy text-white hover:bg-(--navy-hover)"
          >
            {saving ? "Saving..." : "Save calendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
