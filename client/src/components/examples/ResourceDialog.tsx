import { useState } from "react";
import { ResourceDialog } from "../ResourceDialog";
import { Button } from "@/components/ui/button";

export default function ResourceDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-screen bg-background p-8">
      <Button onClick={() => setOpen(true)}>Open Resource Dialog</Button>
      <ResourceDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(data) => console.log("Resource created:", data)}
      />
    </div>
  );
}
