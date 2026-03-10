import api from "@/lib/api";
import type {
  LookaheadSnapshotResponse,
  LookaheadAlertsResponse,
  ProgrammeVersion,
  UploadStatusResponse,
  UploadAcceptedResponse,
} from "@/types";
import { lookaheadKeys } from "./keys";

export async function fetchLookaheadSnapshot(
  projectId: string,
): Promise<LookaheadSnapshotResponse> {
  const response = await api.get<LookaheadSnapshotResponse>(
    lookaheadKeys.snapshot(projectId),
  );
  return response.data;
}

export async function fetchLookaheadAlerts(
  projectId: string,
): Promise<LookaheadAlertsResponse> {
  const response = await api.get<LookaheadAlertsResponse>(
    lookaheadKeys.alerts(projectId),
  );
  return response.data;
}

export async function fetchProgrammeVersions(
  projectId: string,
): Promise<ProgrammeVersion[]> {
  const response = await api.get<ProgrammeVersion[]>(
    lookaheadKeys.versions(projectId),
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchUploadStatus(
  uploadId: string,
): Promise<UploadStatusResponse> {
  const response = await api.get<UploadStatusResponse>(
    lookaheadKeys.uploadStatus(uploadId),
  );
  return response.data;
}

export async function deleteProgrammeVersion(uploadId: string): Promise<void> {
  await api.delete(`/programmes/${uploadId}`);
}

/**
 * Upload a programme file (CSV / XLSX / XLSM) for a project.
 * Uses native fetch so the browser sets the correct multipart boundary;
 * routes through the Next.js proxy which forwards multipart bodies unchanged.
 * Returns 202 immediately — poll fetchUploadStatus() for completion.
 */
export async function uploadProgramme(
  projectId: string,
  file: File,
): Promise<UploadAcceptedResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `/api/proxy?path=/programmes/upload&project_id=${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail =
      typeof payload?.detail === "string"
        ? payload.detail
        : "Upload failed. Please try again.";
    throw new Error(detail);
  }

  return response.json() as Promise<UploadAcceptedResponse>;
}
