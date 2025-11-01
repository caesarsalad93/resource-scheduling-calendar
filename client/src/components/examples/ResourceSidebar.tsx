import { useState } from "react";
import { ResourceSidebar } from "../ResourceSidebar";

const mockResources = [
  { id: "1", name: "Dr. Sarah Johnson", type: "Doctor", color: "#3b82f6" },
  { id: "2", name: "Dr. Michael Chen", type: "Doctor", color: "#8b5cf6" },
  { id: "3", name: "Conference Room A", type: "Room", color: "#10b981" },
  { id: "4", name: "Conference Room B", type: "Room", color: "#f59e0b" },
  { id: "5", name: "John Smith", type: "Technician", color: "#ec4899" },
];

export default function ResourceSidebarExample() {
  const [selectedId, setSelectedId] = useState<string>();

  return (
    <div className="h-screen bg-background flex">
      <ResourceSidebar
        resources={mockResources}
        selectedResourceId={selectedId}
        onResourceSelect={setSelectedId}
        onAddResource={() => console.log("Add resource clicked")}
      />
    </div>
  );
}
