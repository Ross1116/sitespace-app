import api from "@/lib/api";
import type { ApiProject, ProjectNonWorkingDay } from "@/types";

export const AU_HOLIDAY_REGIONS = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
] as const;

export type ProjectCalendarUpdatePayload = {
  default_work_start_time?: string;
  default_work_end_time?: string;
  holiday_country_code?: "AU";
  holiday_region_code?: (typeof AU_HOLIDAY_REGIONS)[number];
  holiday_region_source?: "default" | "location" | "manual";
};

export type ProjectNonWorkingDayPayload = {
  label: string;
  kind: "holiday" | "shutdown" | "weather" | "custom" | "rdo";
};

export async function fetchProject(projectId: string): Promise<ApiProject> {
  const response = await api.get<ApiProject>(`/projects/${projectId}`);
  return response.data;
}

export async function updateProjectCalendar(
  projectId: string,
  payload: ProjectCalendarUpdatePayload,
): Promise<ApiProject> {
  const response = await api.patch<ApiProject>(`/projects/${projectId}`, payload);
  return response.data;
}

export async function fetchProjectNonWorkingDays(params: {
  projectId: string;
  dateFrom: string;
  dateTo: string;
  includeRegional?: boolean;
  includeRdo?: boolean;
}): Promise<ProjectNonWorkingDay[]> {
  const response = await api.get<ProjectNonWorkingDay[]>(
    `/projects/${params.projectId}/non-working-days`,
    {
      params: {
        date_from: params.dateFrom,
        date_to: params.dateTo,
        include_regional: params.includeRegional ?? true,
        include_rdo: params.includeRdo ?? true,
      },
    },
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function upsertProjectNonWorkingDay(
  projectId: string,
  calendarDate: string,
  payload: ProjectNonWorkingDayPayload,
): Promise<ProjectNonWorkingDay> {
  const response = await api.put<ProjectNonWorkingDay>(
    `/projects/${projectId}/non-working-days/${calendarDate}`,
    payload,
  );
  return response.data;
}

export async function deleteProjectNonWorkingDay(
  projectId: string,
  calendarDate: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/non-working-days/${calendarDate}`);
}
