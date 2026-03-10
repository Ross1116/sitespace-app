export const lookaheadKeys = {
  snapshot: (projectId: string): string => `/lookahead/${projectId}`,
  alerts: (projectId: string): string => `/lookahead/${projectId}/alerts`,
  history: (projectId: string): string => `/lookahead/${projectId}/history`,
  versions: (projectId: string): string => `/programmes/${projectId}`,
  uploadStatus: (uploadId: string): string => `/programmes/${uploadId}/status`,
  deleteVersion: (uploadId: string): string => `/programmes/${uploadId}`,
};
