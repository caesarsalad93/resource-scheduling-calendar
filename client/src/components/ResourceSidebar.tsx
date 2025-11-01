import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Resource } from "@shared/schema";

interface ResourceSidebarProps {
  resources: Resource[];
  selectedResourceId?: string;
  onResourceSelect: (resourceId: string) => void;
  onAddResource: () => void;
}

export function ResourceSidebar({
  resources,
  selectedResourceId,
  onResourceSelect,
  onAddResource,
}: ResourceSidebarProps) {
  return (
    <div className="w-60 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm text-muted-foreground">RESOURCES</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {resources.map((resource) => (
            <button
              key={resource.id}
              onClick={() => onResourceSelect(resource.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-md text-left hover-elevate active-elevate-2 ${
                selectedResourceId === resource.id ? "bg-accent" : ""
              }`}
              data-testid={`button-resource-${resource.id}`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: resource.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{resource.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {resource.type}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={onAddResource}
          data-testid="button-add-resource"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>
    </div>
  );
}
