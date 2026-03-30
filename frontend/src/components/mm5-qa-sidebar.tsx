import { ClipboardCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MM5QaState } from "@/hooks/use-mm5-qa";
import MM5QaTab from "@/components/tabs/mm5-qa-tab";

interface MM5QaSidebarProps {
  mm5QaState: MM5QaState;
  onMM5QaStateChange: (updater: (prev: MM5QaState) => MM5QaState) => void;
  onInitSession: () => void;
  onSubmitRating: (rating: number) => void;
  onAdvance: () => void;
  onToggleSegOverlay: () => void;
  onEndSession: () => void;
  onContrastMinChange: (value: number) => void;
  onContrastMaxChange: (value: number) => void;
}

export default function MM5QaSidebar(props: MM5QaSidebarProps) {
  return (
    <aside
      className={cn(
        "border-l bg-background w-80 overflow-hidden flex flex-col",
      )}
    >
      <Tabs
        defaultValue="mm5-qa"
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full justify-start border-b rounded-none px-2 h-12 flex-shrink-0">
          <TabsTrigger
            value="mm5-qa"
            className="data-[state=active]:bg-muted"
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            MM5 QA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mm5-qa" className="flex-1 min-h-0 p-0">
          <MM5QaTab
            mm5QaState={props.mm5QaState}
            onMM5QaStateChange={props.onMM5QaStateChange}
            onInitSession={props.onInitSession}
            onSubmitRating={props.onSubmitRating}
            onAdvance={props.onAdvance}
            onToggleSegOverlay={props.onToggleSegOverlay}
            onEndSession={props.onEndSession}
            onContrastMinChange={props.onContrastMinChange}
            onContrastMaxChange={props.onContrastMaxChange}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
