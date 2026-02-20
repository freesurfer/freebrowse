import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { RatingState } from "@/hooks/use-rating";

interface RatingTabProps {
  ratingState: RatingState;
  onRatingStateChange: (
    updater: (prev: RatingState) => RatingState,
  ) => void;
  onInitSession: () => void;
  onSubmitRating: (rating: number) => void;
  onAdvance: () => void;
  onEndSession: () => void;
}

export default function RatingTab({
  ratingState,
  onRatingStateChange,
  onInitSession,
  onSubmitRating,
  onAdvance,
  onEndSession,
}: RatingTabProps) {
  return (
    <>
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Rating</h2>
        <p className="text-sm text-muted-foreground">
          Rate neuroimaging volumes
        </p>
      </div>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {!ratingState.sessionId ? (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <Input
                  type="text"
                  value={ratingState.name}
                  onChange={(e) =>
                    onRatingStateChange((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Seed</Label>
                <Input
                  type="number"
                  value={ratingState.seed}
                  onChange={(e) =>
                    onRatingStateChange((prev) => ({
                      ...prev,
                      seed: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && onInitSession()}
                  placeholder="Random seed (integer)"
                />
              </div>
              <Button
                className="w-full"
                onClick={onInitSession}
                disabled={ratingState.loading}
              >
                {ratingState.loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Start Session
              </Button>
            </>
          ) : ratingState.done ? (
            <div className="text-center text-muted-foreground py-8">
              <Star className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">All volumes rated!</p>
              <p className="text-sm">
                {ratingState.totalVolumes} / {ratingState.totalVolumes}{" "}
                complete
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Volume {ratingState.currentIndex + 1} of{" "}
                {ratingState.totalVolumes}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Rating</Label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                    <Button
                      key={n}
                      variant={
                        ratingState.selectedRating === n
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => onSubmitRating(n)}
                      disabled={ratingState.loading}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={onAdvance}
                disabled={ratingState.loading}
              >
                {ratingState.loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Next Volume
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onEndSession}
              >
                End Session
              </Button>
            </>
          )}

          {ratingState.error && (
            <p className="text-sm text-destructive">{ratingState.error}</p>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
