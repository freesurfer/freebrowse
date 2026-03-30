import { Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ElucidQaState } from "@/hooks/use-elucid-qa";
import ElucidQaTab from "@/components/tabs/elucid-qa-tab";

interface ElucidQaSidebarProps {
  elucidQaState: ElucidQaState;
  onElucidQaStateChange: (
    updater: (prev: ElucidQaState) => ElucidQaState,
  ) => void;
  onInitSession: () => void;
  onSubmitRating: (rating: number) => void;
  onAdvance: () => void;
  onEndSession: () => void;
}

export default function ElucidQaSidebar(props: ElucidQaSidebarProps) {
  return (
    <aside
      className={cn(
        "border-l bg-background w-80 overflow-hidden flex flex-col",
      )}
    >
      <Tabs
        defaultValue="elucid-qa"
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full justify-start border-b rounded-none px-2 h-12 flex-shrink-0">
          <TabsTrigger
            value="elucid-qa"
            className="data-[state=active]:bg-muted"
          >
            <Star className="h-4 w-4 mr-2" />
            Elucid QA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="elucid-qa" className="flex-1 min-h-0 p-0">
          <ElucidQaTab
            elucidQaState={props.elucidQaState}
            onElucidQaStateChange={props.onElucidQaStateChange}
            onInitSession={props.onInitSession}
            onSubmitRating={props.onSubmitRating}
            onAdvance={props.onAdvance}
            onEndSession={props.onEndSession}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
