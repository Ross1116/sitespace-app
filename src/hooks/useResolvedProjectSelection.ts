"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { normalizeProjectList } from "@/lib/apiNormalization";
import { SWR_CONFIG } from "@/lib/swr";
import { useProjectSelectionStore } from "@/stores/projectSelectionStore";
import type { ApiProject } from "@/types";

type Params = {
  userId?: string;
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
  projectBootstrapTimedOut: boolean;
  mutateProjects: () => Promise<unknown>;
  setProjectId: (projectId: string | null) => void;
};

const PROJECT_BOOTSTRAP_TIMEOUT_MS = 7_000;

export function useResolvedProjectSelection({
  userId,
  enabled = true,
}: Params): Result {
  const userKey = userId ? String(userId) : null;
  const [hasMounted, setHasMounted] = useState(false);
  const [projectBootstrapTimedOut, setProjectBootstrapTimedOut] =
    useState(false);
  const hasProjectSelectionHydrated = useProjectSelectionStore(
    (state) => state.hasHydrated,
  );

  const selectedProjectId = useProjectSelectionStore((state) =>
    userKey ? state.getSelectedProjectId(userKey) : null,
  );
  const setSelectedProjectId = useProjectSelectionStore(
    (state) => state.setSelectedProjectId,
  );
  const clearSelectedProjectId = useProjectSelectionStore(
    (state) => state.clearSelectedProjectId,
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setProjectBootstrapTimedOut(false);
  }, [enabled, userKey]);

  // Keep the first server render and first client render deterministic, but
  // also wait for persisted Zustand state before falling back to the default
  // project. Otherwise the fallback can overwrite the user's saved selection.
  const canApplyPersistedSelection = hasMounted && hasProjectSelectionHydrated;
  const stableSelectedProjectId = canApplyPersistedSelection
    ? selectedProjectId
    : null;
  const isProjectSelectionReady =
    !enabled || !userKey || canApplyPersistedSelection;

  const projectsUrl = useMemo(() => {
    if (!enabled || !userId) return null;
    return "/api/auth/projects?limit=100&skip=0";
  }, [enabled, userId]);

  const fetchProjects = useCallback(async (url: string) => {
    const response = await fetch(url, {
      credentials: "include",
    });

    if (!response.ok) {
      const fallbackMessage =
        response.status === 401
          ? "Not authenticated"
          : "Failed to load projects";
      const payload = await response.json().catch(() => null);
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : fallbackMessage;

      throw new Error(message);
    }

    return response.json();
  }, []);

  const {
    data: projectsRaw,
    error: projectsError,
    isLoading: projectsLoading,
    mutate: mutateProjectsRaw,
  } = useSWR(projectsUrl, fetchProjects, SWR_CONFIG);

  const projects = useMemo<ApiProject[]>(() => {
    if (!projectsRaw) return [];
    return normalizeProjectList(projectsRaw);
  }, [projectsRaw]);

  const hasResolvedProjects = projectsRaw !== undefined || Boolean(projectsError);

  const projectId = useMemo(() => {
    if (!isProjectSelectionReady) return null;
    if (!hasResolvedProjects) return stableSelectedProjectId;
    if (
      stableSelectedProjectId &&
      projects.some((project) => project.id === stableSelectedProjectId)
    ) {
      return stableSelectedProjectId;
    }
    return projects[0]?.id ?? null;
  }, [
    hasResolvedProjects,
    isProjectSelectionReady,
    stableSelectedProjectId,
    projects,
  ]);

  const selectedProject = useMemo<ApiProject | null>(() => {
    if (!projectId) return null;
    return projects.find((project) => project.id === projectId) ?? null;
  }, [projectId, projects]);

  useEffect(() => {
    if (!isProjectSelectionReady || !hasResolvedProjects || !userKey) return;

    if (!projectId) {
      if (stableSelectedProjectId) {
        clearSelectedProjectId(userKey);
      }
      return;
    }

    if (projectId !== stableSelectedProjectId) {
      setSelectedProjectId(userKey, projectId);
    }
  }, [
    userKey,
    isProjectSelectionReady,
    hasResolvedProjects,
    projectId,
    stableSelectedProjectId,
    clearSelectedProjectId,
    setSelectedProjectId,
  ]);

  // Keep the store in sync when another tab writes a new project selection to
  // localStorage. Calling rehydrate() is enough — Zustand's reactive
  // subscription handles the rest (selectedProjectId → projectId → re-render).
  useEffect(() => {
    if (!userKey) return;
    const persistApi = useProjectSelectionStore.persist;
    const storageKey = persistApi.getOptions().name;

    const handler = (e: StorageEvent) => {
      if (e.key !== storageKey && e.key !== null) return;
      void Promise.resolve(persistApi.rehydrate()).catch((err: unknown) =>
        console.error(
          "useResolvedProjectSelection: rehydrate failed on storage event",
          err,
        ),
      );
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [userKey]);

  const rawProjectBootstrapLoading =
    Boolean(userKey) &&
    enabled &&
    (!isProjectSelectionReady ||
      (projectId === null &&
        !projectsError &&
        (projectsLoading || projectsRaw === undefined)));

  useEffect(() => {
    if (!rawProjectBootstrapLoading) {
      setProjectBootstrapTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setProjectBootstrapTimedOut(true);
    }, PROJECT_BOOTSTRAP_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [rawProjectBootstrapLoading]);

  const projectBootstrapLoading =
    rawProjectBootstrapLoading && !projectBootstrapTimedOut;

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
    selectedProjectId: stableSelectedProjectId,
    projectId,
    selectedProject,
    projectBootstrapLoading,
    projectBootstrapTimedOut,
    mutateProjects,
    setProjectId,
  };
}
