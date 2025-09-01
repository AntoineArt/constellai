"use client";

import { useCallback, useRef, useState, useEffect, useId } from "react";
import type { ChatStatus } from "ai";

import { TopBar } from "@/components/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ToolHistorySidebar } from "@/components/tool-history-sidebar";
import { useApiKey } from "@/hooks/use-api-key";
import { useToolHistory, usePreferences, TOOL_IDS } from "@/lib/storage";
import { Copy, RotateCcw, Trash2 } from "lucide-react";
import { Response } from "@/components/ai-elements/response";

export default function ColorPaletteGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.COLOR_PALETTE_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const brandNameId = useId();
  const industryId = useId();
  const moodId = useId();
  const colorPreferencesId = useId();
  const accessibilityId = useId();
  const colorTheoryId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [mood, setMood] = useState("professional");
  const [colorPreferences, setColorPreferences] = useState("");
  const [includeAccessibility, setIncludeAccessibility] = useState(true);
  const [includeColorTheory, setIncludeColorTheory] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const brandNameRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.brandName) {
        setBrandName(execution.inputs.brandName);
      }
      if (execution.inputs?.industry) {
        setIndustry(execution.inputs.industry);
      }
      if (execution.inputs?.mood) {
        setMood(execution.inputs.mood);
      }
      if (execution.inputs?.colorPreferences) {
        setColorPreferences(execution.inputs.colorPreferences);
      }
      if (execution.inputs?.includeAccessibility !== undefined) {
        setIncludeAccessibility(execution.inputs.includeAccessibility);
      }
      if (execution.inputs?.includeColorTheory !== undefined) {
        setIncludeColorTheory(execution.inputs.includeColorTheory);
      }
      if (execution.outputs?.result) {
        setResult(execution.outputs.result);
      }
      if (execution.settings?.selectedModel) {
        setSelectedModel(execution.settings.selectedModel);
      }
    }
  }, [toolHistory.isLoaded, toolHistory.currentExecution]);

  // Auto-focus input when API key is available
  useEffect(() => {
    if (hasApiKey && brandNameRef.current) {
      brandNameRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setBrandName("");
    setIndustry("");
    setMood("professional");
    setColorPreferences("");
    setIncludeAccessibility(true);
    setIncludeColorTheory(true);
    setResult("");
    toolHistory.clearActiveExecution();
  }, [status, toolHistory]);

  const copyResult = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
    } catch (error) {
      console.error("Failed to copy result:", error);
    }
  }, [result]);

  const handleSubmit = useCallback(async () => {
    if (
      !hasApiKey ||
      status === "submitted" ||
      status === "streaming" ||
      !brandName.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/color-palette-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          brandName: brandName.trim(),
          industry: industry.trim(),
          mood,
          colorPreferences: colorPreferences.trim(),
          includeAccessibility,
          includeColorTheory,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      if (!response.body) {
        const text = await response.text();
        setResult(text);
        setStatus(undefined);
        controllerRef.current = null;
        return;
      }

      setStatus("streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let resultContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultContent += decoder.decode(value, { stream: true });
        setResult(resultContent);
      }

      resultContent += decoder.decode();
      setResult(resultContent);

      controllerRef.current = null;
      setStatus(undefined);

      // Save execution
      if (!toolHistory.currentExecution) {
        await toolHistory.createNewExecution(
          {
            brandName: brandName.trim(),
            industry: industry.trim(),
            mood,
            colorPreferences: colorPreferences.trim(),
            includeAccessibility,
            includeColorTheory,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          brandName: brandName.trim(),
          industry: industry.trim(),
          mood,
          colorPreferences: colorPreferences.trim(),
          includeAccessibility,
          includeColorTheory,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating color palette.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    brandName,
    industry,
    mood,
    colorPreferences,
    includeAccessibility,
    includeColorTheory,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regeneratePalette = useCallback(async () => {
    if (status === "streaming" || !brandName.trim()) return;
    await handleSubmit();
  }, [status, brandName, handleSubmit]);

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await handleSubmit();
    },
    [handleSubmit]
  );

  return (
    <div className="h-screen overflow-hidden flex">
      {/* Tool History Sidebar */}
      <ToolHistorySidebar
        executions={toolHistory.executions}
        activeExecutionId={toolHistory.activeExecutionId}
        onSelectExecution={toolHistory.switchToExecution}
        onDeleteExecution={toolHistory.deleteExecution}
        onRenameExecution={toolHistory.renameExecution}
        onNewExecution={async () => {
          if (status !== "streaming") {
            clearForm();
            await toolHistory.createNewExecution(
              {
                brandName: "",
                industry: "",
                mood: "professional",
                colorPreferences: "",
                includeAccessibility: true,
                includeColorTheory: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Color Palette Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Color Palette Generator"
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate color palettes
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-6">
              {/* Input Form */}
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={brandNameId}>Brand Name *</Label>
                      <Input
                        ref={brandNameRef}
                        id={brandNameId}
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Your Brand Name"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={industryId}>Industry</Label>
                        <Input
                          id={industryId}
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="Technology, Healthcare, Finance..."
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={moodId}>Mood</Label>
                        <Select value={mood} onValueChange={setMood}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">
                              Professional
                            </SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                            <SelectItem value="playful">Playful</SelectItem>
                            <SelectItem value="elegant">Elegant</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="calm">Calm</SelectItem>
                            <SelectItem value="energetic">Energetic</SelectItem>
                            <SelectItem value="trustworthy">
                              Trustworthy
                            </SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="vintage">Vintage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={colorPreferencesId}>
                        Color Preferences (Optional)
                      </Label>
                      <Textarea
                        id={colorPreferencesId}
                        value={colorPreferences}
                        onChange={(e) => setColorPreferences(e.target.value)}
                        placeholder="Any specific colors you like or want to avoid? (e.g., 'I love blues and greens', 'Avoid reds')"
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Color Palette Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={accessibilityId}
                            checked={includeAccessibility}
                            onCheckedChange={(checked) =>
                              setIncludeAccessibility(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={accessibilityId}
                            className="text-sm font-normal"
                          >
                            Include accessibility considerations (WCAG
                            compliance)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={colorTheoryId}
                            checked={includeColorTheory}
                            onCheckedChange={(checked) =>
                              setIncludeColorTheory(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={colorTheoryId}
                            className="text-sm font-normal"
                          >
                            Include color theory explanations
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!brandName.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Color Palette"}
                      </Button>
                      {status === "streaming" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (controllerRef.current) {
                              controllerRef.current.abort();
                              controllerRef.current = null;
                              setStatus(undefined);
                            }
                          }}
                        >
                          Stop
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={regeneratePalette}
                        disabled={
                          status === "streaming" || !brandName.trim() || !result
                        }
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearForm}
                        disabled={status === "streaming"}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Results */}
              {result && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Generated Color Palette
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyResult}
                        disabled={copiedResult}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {copiedResult ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <Response>{result}</Response>
                  </CardContent>
                </Card>
              )}

              {/* Loading indicator */}
              {(status === "submitted" || status === "streaming") &&
                !result && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {status === "submitted"
                            ? "Analyzing brand requirements..."
                            : "Generating color palette..."}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
