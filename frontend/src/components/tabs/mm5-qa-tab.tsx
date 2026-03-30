import { Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LabeledSliderWithInput } from "@/components/ui/labeled-slider-with-input";
import type { MM5QaState } from "@/hooks/use-mm5-qa";

interface MM5QaTabProps {
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

export default function MM5QaTab({
  mm5QaState,
  onMM5QaStateChange,
  onInitSession,
  onSubmitRating,
  onAdvance,
  onToggleSegOverlay,
  onEndSession,
  onContrastMinChange,
  onContrastMaxChange,
}: MM5QaTabProps) {
  return (
    <>
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">MM5 QA</h2>
        <p className="text-sm text-muted-foreground">
          Rate vol-seg pair quality
        </p>
      </div>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {!mm5QaState.sessionId ? (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <Input
                  type="text"
                  value={mm5QaState.name}
                  onChange={(e) =>
                    onMM5QaStateChange((prev) => ({
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
                  value={mm5QaState.seed}
                  onChange={(e) =>
                    onMM5QaStateChange((prev) => ({
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
                disabled={mm5QaState.loading}
              >
                {mm5QaState.loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Start Session
              </Button>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Sample #{mm5QaState.currentIndex + 1}
              </div>

              {mm5QaState.metadata && (
                <div className="space-y-1 text-xs text-muted-foreground bg-muted p-2 rounded">
                  <div>
                    <span className="font-medium">Dataset:</span>{" "}
                    {mm5QaState.metadata.dataset}
                  </div>
                  <div>
                    <span className="font-medium">Modality:</span>{" "}
                    {mm5QaState.metadata.modality}
                  </div>
                  <div>
                    <span className="font-medium">Label:</span>{" "}
                    {mm5QaState.metadata.labelName || `#${mm5QaState.metadata.labelIndex}`}
                  </div>
                </div>
              )}

              {mm5QaState.blinded && !mm5QaState.metadata && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded italic">
                  Blinded session — dataset info hidden
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onToggleSegOverlay}
              >
                <Eye className="mr-2 h-4 w-4" />
                Toggle Segmentation
              </Button>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Contrast</Label>
                <LabeledSliderWithInput
                  label="Min"
                  value={mm5QaState.contrastMin}
                  onValueChange={onContrastMinChange}
                  min={mm5QaState.globalMin}
                  max={mm5QaState.globalMax}
                  step={0.01}
                  decimalPlaces={2}
                />
                <LabeledSliderWithInput
                  label="Max"
                  value={mm5QaState.contrastMax}
                  onValueChange={onContrastMaxChange}
                  min={mm5QaState.globalMin}
                  max={mm5QaState.globalMax}
                  step={0.01}
                  decimalPlaces={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Rating</Label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                    <Button
                      key={n}
                      variant={
                        mm5QaState.selectedRating === n ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => onSubmitRating(n)}
                      disabled={mm5QaState.loading}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
                <Button
                  variant={
                    mm5QaState.selectedRating === 0 ? "default" : "outline"
                  }
                  size="sm"
                  className="w-full"
                  onClick={() => onSubmitRating(0)}
                  disabled={mm5QaState.loading}
                >
                  N/A
                </Button>
              </div>

              <Button
                className="w-full"
                onClick={onAdvance}
                disabled={mm5QaState.loading || mm5QaState.selectedRating === null}
              >
                {mm5QaState.loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Next Sample
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

          {mm5QaState.error && (
            <p className="text-sm text-destructive">{mm5QaState.error}</p>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
