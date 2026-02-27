import { ClipboardCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function QaSidebar() {
  return (
    <aside
      className={cn(
        "border-l bg-background w-80 overflow-hidden flex flex-col",
      )}
    >
      <Tabs
        defaultValue="qa"
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full justify-start border-b rounded-none px-2 h-12 flex-shrink-0">
          <TabsTrigger
            value="qa"
            className="data-[state=active]:bg-muted"
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            QA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qa" className="flex-1 min-h-0 p-4">
          <p className="text-sm text-muted-foreground">todo</p>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
