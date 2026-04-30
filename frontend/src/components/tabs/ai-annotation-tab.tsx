import { useCallback, useEffect, useMemo, useState } from "react";
import { useFreeBrowseStore } from "@/store";
import { Brain, Trash2, LogOut, Undo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LabeledSliderWithInput } from "@/components/ui/labeled-slider-with-input";
import { randomSessionName } from "@/lib/random-session-name";
import type { AiSessionSummary } from "@/store/ai-slice";

interface AiAnnotationTabProps {
  volumesCount: number;
  onNewSession: (sessionName: string) => Promise<void>;
  onLoadSession: (sessionId: string) => Promise<void>;
  onRunSegmentation: (mlId: string, labelValue: number) => Promise<void>;
  onExitAndSaveSession: () => Promise<void>;
  onExitAndDeleteSession: () => Promise<void>;
  onRefreshSessions: () => Promise<void>;
  onDrawModeChange: (mode: "none" | "pen" | "wand") => void;
  onDrawingOpacityChange: (value: number) => void;
  onPenValueChange: (value: number) => void;
  onPenFillChange: (checked: boolean) => void;
  onPenErasesChange: (checked: boolean) => void;
  onMagicWand2dOnlyChange: (checked: boolean) => void;
  onMagicWandMaxDistanceChange: (value: number) => void;
  onMagicWandThresholdChange: (value: number) => void;
  onDrawUndo: () => void;
}

type ModelInfo = {
  ml_id: string;
  name: string;
  config_path: string | null;
};

export default function AiAnnotationTab({
  volumesCount,
  onNewSession,
  onLoadSession,
  onRunSegmentation,
  onExitAndSaveSession,
  onExitAndDeleteSession,
  onRefreshSessions,
  onDrawModeChange,
  onDrawingOpacityChange,
  onPenValueChange,
  onPenFillChange,
  onPenErasesChange,
  onMagicWand2dOnlyChange,
  onMagicWandMaxDistanceChange,
  onMagicWandThresholdChange,
  onDrawUndo,
}: AiAnnotationTabProps) {
  const aiSessions = useFreeBrowseStore((s) => s.aiSessions);
  const activeSession = useFreeBrowseStore((s) => s.aiActiveSession);
  const drawingOptions = useFreeBrowseStore((s) => s.drawingOptions);

  const [sessionName, setSessionName] = useState<string>(() => randomSessionName());
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [newError, setNewError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedMlId, setSelectedMlId] = useState<string>("");
  const [labelValue, setLabelValue] = useState<number>(1);
  const [inferring, setInferring] = useState<boolean>(false);
  const [inferError, setInferError] = useState<string | null>(null);
  const [exitBusy, setExitBusy] = useState<boolean>(false);

  useEffect(() => {
    void onRefreshSessions();
  }, [onRefreshSessions]);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/ai/model/list");
      if (!res.ok) throw new Error(`GET /ai/model/list failed: ${res.status}`);
      const body: ModelInfo[] = await res.json();
      setModels(body);
      setSelectedMlId((prev) =>
        prev && body.some((m) => m.ml_id === prev)
          ? prev
          : body[0]?.ml_id ?? "",
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void fetchModels();
  }, [fetchModels]);

  const sessionsById = useMemo(() => {
    const map: Record<string, AiSessionSummary> = {};
    for (const s of aiSessions) map[s.session_id] = s;
    return map;
  }, [aiSessions]);

  const handleClickNewSession = async () => {
    setNewError(null);
    setLoading(true);
    try {
      await onNewSession(sessionName);
    } catch (err) {
      setNewError(err instanceof Error ? err.message : String(err));
      setSessionName(randomSessionName());
    } finally {
      setLoading(false);
    }
  };

  const handleClickLoadSession = async () => {
    if (!selectedSessionId) return;
    setLoading(true);
    try {
      await onLoadSession(selectedSessionId);
    } catch (err) {
      console.error("Load Session failed:", err);
      setNewError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadModels = () => {
    void fetchModels();
  };

  const handleRunSegmentation = async () => {
    if (!activeSession || !selectedMlId) return;
    setInferError(null);
    setInferring(true);
    try {
      await onRunSegmentation(selectedMlId, labelValue);
    } catch (err) {
      setInferError(err instanceof Error ? err.message : String(err));
    } finally {
      setInferring(false);
    }
  };

  const handleExitAndSave = async () => {
    setInferError(null);
    setExitBusy(true);
    try {
      await onExitAndSaveSession();
    } catch (err) {
      setInferError(err instanceof Error ? err.message : String(err));
    } finally {
      setExitBusy(false);
    }
  };

  const handleExitAndDelete = async () => {
    setInferError(null);
    setExitBusy(true);
    try {
      await onExitAndDeleteSession();
    } catch (err) {
      setInferError(err instanceof Error ? err.message : String(err));
    } finally {
      setExitBusy(false);
    }
  };

  const handleClickMode = (mode: "positive" | "negative") => {
    const value = mode === "positive" ? 1 : 2;
    onPenValueChange(value);
    if (drawingOptions.mode !== "pen") onDrawModeChange("pen");
  };

  const renderPreSession = () => (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Session Name</Label>
        <Input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Enter session name..."
        />
        <Button
          className="w-full"
          onClick={handleClickNewSession}
          disabled={volumesCount === 0 || loading}
        >
          New Session
        </Button>
        {volumesCount === 0 && (
          <p className="text-xs text-muted-foreground">
            Load a volume before creating a session.
          </p>
        )}
        {newError && <p className="text-xs text-destructive">{newError}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Previous Sessions</Label>
        <Select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          disabled={aiSessions.length === 0 || loading}
        >
          <option value="">
            {aiSessions.length === 0
              ? "(no sessions)"
              : "Select a session..."}
          </option>
          {aiSessions.map((s) => (
            <option key={s.session_id} value={s.session_id}>
              {s.session_name}
            </option>
          ))}
        </Select>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleClickLoadSession}
          disabled={!selectedSessionId || loading}
        >
          Load Session
        </Button>
        {selectedSessionId && sessionsById[selectedSessionId] && (
          <p className="text-xs text-muted-foreground">
            volume: {sessionsById[selectedSessionId].volume_path ?? "—"}
            <br />
            annotations:{" "}
            {sessionsById[selectedSessionId].annotation_path ?? "—"}
          </p>
        )}
      </div>
    </div>
  );

  const renderPostSession = () => {
    if (!activeSession) return null;
    return (
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Session</Label>
          <p className="text-sm">
            {activeSession.session_name}{" "}
            <span className="text-xs text-muted-foreground">
              ({activeSession.session_id.slice(0, 8)}…)
            </span>
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => void handleExitAndSave()}
          disabled={inferring || exitBusy}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Exit and Save Session
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => void handleExitAndDelete()}
          disabled={inferring || exitBusy}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Exit and Delete Session
        </Button>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Select AI model</Label>
          <Select
            value={selectedMlId}
            onChange={(e) => setSelectedMlId(e.target.value)}
          >
            {models.length === 0 ? (
              <option value="">(no models available)</option>
            ) : (
              models.map((m) => (
                <option key={m.ml_id} value={m.ml_id}>
                  {m.name}
                </option>
              ))
            )}
          </Select>
          <Button variant="outline" className="w-full" onClick={handleLoadModels}>
            Reload Models
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Draw Mode</Label>
          <Select
            value={drawingOptions.mode}
            onChange={(e) =>
              onDrawModeChange(e.target.value as "none" | "pen" | "wand")
            }
          >
            <option value="none">None</option>
            <option value="pen">Pen</option>
            <option value="wand">Magic Wand</option>
          </Select>
        </div>

        <LabeledSliderWithInput
          label="Drawing Opacity"
          value={drawingOptions.opacity}
          onValueChange={onDrawingOpacityChange}
          min={0}
          max={1}
          step={0.01}
        />

        {(drawingOptions.mode === "pen" || drawingOptions.mode === "wand") && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onDrawUndo}
          >
            <Undo className="mr-2 h-4 w-4" />
            Undo
          </Button>
        )}

        {drawingOptions.mode === "pen" && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ai-pen-fill"
                checked={drawingOptions.penFill}
                onCheckedChange={onPenFillChange}
              />
              <Label htmlFor="ai-pen-fill" className="text-sm font-medium">
                Pen Fill
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ai-pen-erases"
                checked={drawingOptions.penErases}
                onCheckedChange={onPenErasesChange}
              />
              <Label htmlFor="ai-pen-erases" className="text-sm font-medium">
                Pen Erases
              </Label>
            </div>
          </>
        )}

        {drawingOptions.mode === "wand" && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ai-magic-wand-2d-only"
                checked={drawingOptions.magicWand2dOnly}
                onCheckedChange={onMagicWand2dOnlyChange}
              />
              <Label
                htmlFor="ai-magic-wand-2d-only"
                className="text-sm font-medium"
              >
                2D Only
              </Label>
            </div>
            <LabeledSliderWithInput
              label="Max Distance (mm)"
              value={drawingOptions.magicWandMaxDistanceMM}
              onValueChange={onMagicWandMaxDistanceChange}
              min={2}
              max={500}
              step={1}
            />
            <LabeledSliderWithInput
              label="Threshold Percentage"
              value={drawingOptions.magicWandThresholdPercent}
              onValueChange={onMagicWandThresholdChange}
              min={0.0}
              max={1.0}
              step={0.01}
            />
          </>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Click Mode</Label>
          <div className="flex gap-2">
            <Button
              variant={drawingOptions.penValue === 1 ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => handleClickMode("positive")}
            >
              + Positive
            </Button>
            <Button
              variant={drawingOptions.penValue === 2 ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => handleClickMode("negative")}
            >
              − Negative
            </Button>
          </div>
        </div>

        <LabeledSliderWithInput
          label="Result label value"
          value={labelValue}
          onValueChange={setLabelValue}
          min={0}
          max={255}
          step={1}
          decimalPlaces={0}
        />
        <p className="text-xs text-muted-foreground -mt-2">
          Foreground voxel value in the returned mask.
        </p>

        <Button
          className="w-full"
          onClick={() => void handleRunSegmentation()}
          disabled={!selectedMlId || inferring || exitBusy}
        >
          <Brain className="mr-2 h-4 w-4" />
          {inferring ? "Running segmentation…" : "Run Segmentation"}
        </Button>

        {inferError && (
          <p className="text-xs text-destructive">{inferError}</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">AI annotation (experimental)</h2>
        <p className="text-sm text-muted-foreground">
          Guide an AI model with positive and negative seed voxels.
        </p>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        {activeSession ? renderPostSession() : renderPreSession()}
      </ScrollArea>
    </div>
  );
}
