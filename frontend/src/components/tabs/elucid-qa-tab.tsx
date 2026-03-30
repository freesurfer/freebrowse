import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ElucidQaState } from "@/hooks/use-elucid-qa";

interface ElucidQaTabProps {
  elucidQaState: ElucidQaState;
  onElucidQaStateChange: (
    updater: (prev: ElucidQaState) => ElucidQaState,
  ) => void;
  onInitSession: () => void;
  onSubmitRating: (rating: number) => void;
  onAdvance: () => void;
  onEndSession: () => void;
}

export default function ElucidQaTab({
  elucidQaState,
  onElucidQaStateChange,
  onInitSession,
  onSubmitRating,
  onAdvance,
  onEndSession,
}: ElucidQaTabProps) {
  return (
    <>
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Elucid QA</h2>
        <p className="text-sm text-muted-foreground">
          Rate neuroimaging volumes
        </p>
      </div>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {!elucidQaState.sessionId ? (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <Input
                  type="text"
                  value={elucidQaState.name}
                  onChange={(e) =>
                    onElucidQaStateChange((prev) => ({
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
                  value={elucidQaState.seed}
                  onChange={(e) =>
                    onElucidQaStateChange((prev) => ({
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
                disabled={elucidQaState.loading}
              >
                {elucidQaState.loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Start Session
              </Button>
            </>
          ) : elucidQaState.done ? (
            <div className="text-center text-muted-foreground py-8">
              <Star className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">All volumes rated!</p>
              <p className="text-sm">
                {elucidQaState.totalVolumes} / {elucidQaState.totalVolumes}{" "}
                complete
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Volume {elucidQaState.currentIndex + 1} of{" "}
                {elucidQaState.totalVolumes}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Rating</Label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                    <Button
                      key={n}
                      variant={
                        elucidQaState.selectedRating === n
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => onSubmitRating(n)}
                      disabled={elucidQaState.loading}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={onAdvance}
                disabled={elucidQaState.loading}
              >
                {elucidQaState.loading && (
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

          {elucidQaState.error && (
            <p className="text-sm text-destructive">{elucidQaState.error}</p>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
