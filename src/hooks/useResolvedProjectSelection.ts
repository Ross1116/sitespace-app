"use client";

import { useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";
import { normalizeProjectList } from "@/lib/apiNormalization";
import { swrFetcher, SWR_CONFIG } from "@/lib/swr";
import { useProjectSelectionStore } from "@/stores/projectSelectionStore";
import type { ApiProject } from "@/types";

type Params = {
  userId?: string;
  role?: string;
  enabled?: boolean;
};

type Result = {
  projects: ApiProject[];
  projectsUrl: string | null;
  projectsRaw: unknown;
  projectsError: unknown;
  projectsLoading: boolean;
  hasResolvedProjects: boolean;
  selectedProjectId: string | null;
  projectId: string | null;
  selectedProject: ApiProject | null;
  projectBootstrapLoading: boolean;
  mutateProjects: () => Promise<unknown>;
  setProjectId: (projectId: string | null) => void;
};

export function useResolvedProjectSelection({
  userId,
  role,
  enabled = true,
}: Params): Result {
  const userKey = userId ? String(userId) : null;

  const selectedProjectId = useProjectSelectionStore((state) =>
    userKey ? state.getSelectedProjectId(userKey) : null,
  );
  const setSelectedProjectId = useProjectSelectionStore(
    (state) => state.setSelectedProjectId,
  );
  const clearSelectedProjectId = useProjectSelectionStore(
    (state) => state.clearSelectedProjectId,
  );

  const projectsUrl = useMemo(() => {
    if (!enabled || !userId) return null;
    if (role === "subcontractor") {
      return `/subcontractors/${userId}/projects`;
    }
    return "/projects/?my_projects=true&limit=100&skip=0";
  }, [enabled, userId, role]);

  const {
    data: projectsRaw,
    error: projectsError,
    isLoading: projectsLoading,
    mutate: mutateProjectsRaw,
  } = useSWR(projectsUrl, swrFetcher, SWR_CONFIG);

  const projects = useMemo<ApiProject[]>(() => {
    if (!projectsRaw) return [];
    return normalizeProjectList(projectsRaw);
  }, [projectsRaw]);

  const hasResolvedProjects = projectsRaw !== undefined || Boolean(projectsError);

  const projectId = useMemo(() => {
    if (!hasResolvedProjects) return selectedProjectId;
    if (selectedProjectId && projects.some((project) => project.id === selectedProjectId)) {
      return selectedProjectId;
    }
    return projects[0]?.id ?? null;
  }, [hasResolvedProjects, selectedProjectId, projects]);

  const selectedProject = useMemo<ApiProject | null>(() => {
    if (!projectId) return null;
    return projects.find((project) => project.id === projectId) ?? null;
  }, [projectId, projects]);

  useEffect(() => {
    if (!hasResolvedProjects || !userKey) return;

    if (!projectId) {
      if (selectedProjectId) {
        clearSelectedProjectId(userKey);
      }
      return;
    }

    if (projectId !== selectedProjectId) {
      setSelectedProjectId(userKey, projectId);
    }
  }, [
    userKey,
    hasResolvedProjects,
    projectId,
    selectedProjectId,
    clearSelectedProjectId,
    setSelectedProjectId,
  ]);

  const projectBootstrapLoading =
    Boolean(userKey) &&
    projectId === null &&
    !projectsError &&
    (projectsLoading || projectsRaw === undefined);

  const setProjectId = useCallback(
    (nextProjectId: string | null) => {
      if (!userKey) return;
      if (!nextProjectId) {
        clearSelectedProjectId(userKey);
        return;
      }
      if (nextProjectId !== selectedProjectId) {
        setSelectedProjectId(userKey, nextProjectId);
      }
    },
    [userKey, clearSelectedProjectId, selectedProjectId, setSelectedProjectId],
  );

  const mutateProjects = useCallback(() => mutateProjectsRaw(), [mutateProjectsRaw]);

  return {
    projects,
    projectsUrl,
    projectsRaw,
    projectsError,
    projectsLoading,
    hasResolvedProjects,
    selectedProjectId,
    projectId,
    selectedProject,
    projectBootstrapLoading,
    mutateProjects,
    setProjectId,
  };
}
