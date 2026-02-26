import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProjectSelectionStore } from "@/stores/projectSelectionStore";

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  onChange?: (projectId: string) => void;
  showSearch?: boolean;
  maxHeight?: number | string;
  userId?: string | number;
}

function ProjectSelector({
  projects,
  onChange,
  showSearch = true,
  maxHeight = "400px",
  userId,
}: ProjectSelectorProps) {
  const userKey = userId ? String(userId) : null;
  const selectedProjectId = useProjectSelectionStore((state) =>
    userKey ? state.selectedProjectIds[userKey] : undefined,
  );
  const setSelectedProjectId = useProjectSelectionStore(
    (state) => state.setSelectedProjectId,
  );

  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const isValidProjectId = useCallback(
    (projectId?: string) =>
      !!projectId && projects.some((project) => project.id === projectId),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const trimmedLower = searchQuery.trim().toLowerCase();

    if (!trimmedLower) {
      return projects;
    }

    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(trimmedLower) ||
        project.id.toLowerCase().includes(trimmedLower),
    );
  }, [projects, searchQuery]);

  useEffect(() => {
    if (projects.length === 0) {
      if (selectedProject) setSelectedProject(undefined);
      return;
    }

    const validStoredProjectId = isValidProjectId(selectedProjectId)
      ? selectedProjectId
      : undefined;
    const validSelectedProject = isValidProjectId(selectedProject)
      ? selectedProject
      : undefined;
    const nextProjectId =
      validStoredProjectId ?? validSelectedProject ?? projects[0].id;

    if (nextProjectId !== selectedProject) {
      setSelectedProject(nextProjectId);
      onChange?.(nextProjectId);
    }

    if (userKey && nextProjectId !== selectedProjectId) {
      setSelectedProjectId(userKey, nextProjectId);
    }
  }, [
    isValidProjectId,
    selectedProjectId,
    setSelectedProjectId,
    userKey,
    projects,
    selectedProject,
    onChange,
  ]);

  const handleChange = (value: string) => {
    setSelectedProject(value);

    if (userKey) {
      setSelectedProjectId(userKey, value);
    }

    if (onChange) onChange(value);
  };

  if (projects.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500 bg-gray-50 border-dashed">
        <div className="flex flex-col items-center justify-center space-y-2">
          <p className="font-medium">No projects available</p>
          <p className="text-xs">Create a project to get started</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full p-1">
      {showSearch && projects.length > 3 && (
        <div className="relative px-4 pt-4 pb-2">
          <Search className="absolute left-6 top-6 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search projects..."
            className="pl-9 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <div className="overflow-y-auto w-full" style={{ maxHeight }}>
        <RadioGroup
          value={selectedProject}
          onValueChange={handleChange}
          className="flex flex-col w-full"
        >
          {filteredProjects.map((project) => {
            const projectName = project.name;
            const isSelected = project.id === selectedProject;

            return (
              <div key={project.id} className="w-full">
                <RadioGroupItem
                  value={project.id}
                  id={`project-${project.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`project-${project.id}`}
                  className={`flex flex-col w-full border-b last:border-b-0 border-gray-100
                    ${isSelected ? "bg-amber-50" : "hover:bg-gray-50"} 
                    cursor-pointer transition-all duration-200
                    ${isSelected ? "py-4" : "py-3"}`}
                >
                  <div className="flex items-center px-4">
                    <span
                      className={`inline-block w-3 h-3 rounded-full flex-shrink-0 mr-3 mt-0.5`}
                    />

                    <div className="flex-grow">
                      <div className="flex flex-col">
                        <span
                          className={`font-bold ${isSelected ? "text-amber-900" : "text-gray-700"}`}
                        >
                          {projectName}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="mt-3">
                          <div className="flex items-center text-amber-600">
                            <CheckCircle
                              size={16}
                              className="mr-1.5 flex-shrink-0"
                            />
                            <span className="text-sm font-medium">
                              Currently working on {projectName} project
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}

export default ProjectSelector;
