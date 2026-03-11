import { Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { RatingState } from "@/hooks/use-rating";
import RatingTab from "@/components/tabs/rating-tab";

interface QaSidebarProps {
  ratingState: RatingState;
  onRatingStateChange: (
    updater: (prev: RatingState) => RatingState,
  ) => void;
  onInitSession: () => void;
  onSubmitRating: (rating: number) => void;
  onAdvance: () => void;
  onEndSession: () => void;
}

export default function QaSidebar(props: QaSidebarProps) {
  return (
    <aside
      className={cn(
        "border-l bg-background w-80 overflow-hidden flex flex-col",
      )}
    >
      <Tabs
        defaultValue="rating"
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full justify-start border-b rounded-none px-2 h-12 flex-shrink-0">
          <TabsTrigger
            value="rating"
            className="data-[state=active]:bg-muted"
          >
            <Star className="h-4 w-4 mr-2" />
            Rating
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rating" className="flex-1 min-h-0 p-0">
          <RatingTab
            ratingState={props.ratingState}
            onRatingStateChange={props.onRatingStateChange}
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
