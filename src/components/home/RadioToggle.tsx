import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Project {
  id: string;
  text: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  onChange?: (projectId: string) => void;
  showSearch?: boolean;
  maxHeight?: number | string;
}

function ProjectSelector({ 
  projects, 
  onChange, 
  showSearch = true,
  maxHeight = "400px"
}: ProjectSelectorProps) {
  const [selectedProject, setSelectedProject] = useState<string | undefined>(
    projects.length > 0 ? projects[0].id : undefined
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleProjects, setVisibleProjects] = useState<Project[]>(projects);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
    
    // Update filtered projects when projects array changes
    filterProjects();
  }, [projects, selectedProject]);

  useEffect(() => {
    filterProjects();
  }, [searchQuery, projects]);

  const filterProjects = () => {
    if (!searchQuery.trim()) {
      setVisibleProjects(projects);
      return;
    }
    
    const filtered = projects.filter(project => 
      project.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setVisibleProjects(filtered);
  };

  const handleChange = (value: string) => {
    setSelectedProject(value);
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
      {showSearch && visibleProjects.length > 3 && (
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
      
      <div 
        className="overflow-y-auto w-full" 
        style={{ maxHeight }}
      >
        <RadioGroup
          value={selectedProject}
          onValueChange={handleChange}
          className="flex flex-col w-full"
        >
          {visibleProjects.map((project) => {
            const projectName = project.text;
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
                    ${isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'} 
                    cursor-pointer transition-all duration-200
                    ${isSelected ? 'py-4' : 'py-3'}`}
                >
                  <div className="flex items-center px-4">
                    <span 
                      className={`inline-block w-3 h-3 rounded-full flex-shrink-0 mr-3 mt-0.5`}
                    />
                    
                    <div className="flex-grow">
                      <div className="flex flex-col">
                        <span className={`font-medium ${isSelected ? 'text-amber-900' : 'text-gray-700'}`}>
                          {project.id} - {projectName}
                        </span>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-3">
                          <div className="flex items-center text-amber-600">
                            <CheckCircle size={16} className="mr-1.5 flex-shrink-0" />
                            <span className="text-sm font-medium">Currently working on {projectName} project</span>
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