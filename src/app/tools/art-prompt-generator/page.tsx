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

export default function ArtPromptGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.ART_PROMPT_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const artStyleId = useId();
  const subjectId = useId();
  const moodId = useId();
  const detailedDescriptionsId = useId();
  const technicalSpecsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [artStyle, setArtStyle] = useState("realistic");
  const [subject, setSubject] = useState("");
  const [mood, setMood] = useState("neutral");
  const [includeDetailedDescriptions, setIncludeDetailedDescriptions] =
    useState(true);
  const [includeTechnicalSpecs, setIncludeTechnicalSpecs] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.artStyle) {
        setArtStyle(execution.inputs.artStyle);
      }
      if (execution.inputs?.subject) {
        setSubject(execution.inputs.subject);
      }
      if (execution.inputs?.mood) {
        setMood(execution.inputs.mood);
      }
      if (execution.inputs?.includeDetailedDescriptions !== undefined) {
        setIncludeDetailedDescriptions(
          execution.inputs.includeDetailedDescriptions
        );
      }
      if (execution.inputs?.includeTechnicalSpecs !== undefined) {
        setIncludeTechnicalSpecs(execution.inputs.includeTechnicalSpecs);
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
    if (hasApiKey && subjectRef.current) {
      subjectRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setArtStyle("realistic");
    setSubject("");
    setMood("neutral");
    setIncludeDetailedDescriptions(true);
    setIncludeTechnicalSpecs(true);
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
      !subject.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/art-prompt-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          artStyle,
          subject: subject.trim(),
          mood,
          includeDetailedDescriptions,
          includeTechnicalSpecs,
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
            artStyle,
            subject: subject.trim(),
            mood,
            includeDetailedDescriptions,
            includeTechnicalSpecs,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          artStyle,
          subject: subject.trim(),
          mood,
          includeDetailedDescriptions,
          includeTechnicalSpecs,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating art prompt.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    artStyle,
    subject,
    mood,
    includeDetailedDescriptions,
    includeTechnicalSpecs,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regeneratePrompt = useCallback(async () => {
    if (status === "streaming" || !subject.trim()) return;
    await handleSubmit();
  }, [status, subject, handleSubmit]);

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
                artStyle: "realistic",
                subject: "",
                mood: "neutral",
                includeDetailedDescriptions: true,
                includeTechnicalSpecs: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Art Prompt Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Art Prompt Generator"
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
                    generate art prompts
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
                      <Label htmlFor={subjectId}>Subject *</Label>
                      <Input
                        ref={subjectRef}
                        id={subjectId}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., A futuristic cityscape, Portrait of a warrior, Sunset over mountains..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={artStyleId}>Art Style</Label>
                        <Select value={artStyle} onValueChange={setArtStyle}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realistic">Realistic</SelectItem>
                            <SelectItem value="impressionist">
                              Impressionist
                            </SelectItem>
                            <SelectItem value="abstract">Abstract</SelectItem>
                            <SelectItem value="surrealist">
                              Surrealist
                            </SelectItem>
                            <SelectItem value="minimalist">
                              Minimalist
                            </SelectItem>
                            <SelectItem value="expressionist">
                              Expressionist
                            </SelectItem>
                            <SelectItem value="cubist">Cubist</SelectItem>
                            <SelectItem value="pop-art">Pop Art</SelectItem>
                            <SelectItem value="digital-art">
                              Digital Art
                            </SelectItem>
                            <SelectItem value="watercolor">
                              Watercolor
                            </SelectItem>
                            <SelectItem value="oil-painting">
                              Oil Painting
                            </SelectItem>
                            <SelectItem value="photography">
                              Photography
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={moodId}>Mood/Atmosphere</Label>
                        <Select value={mood} onValueChange={setMood}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="neutral">Neutral</SelectItem>
                            <SelectItem value="peaceful">Peaceful</SelectItem>
                            <SelectItem value="dramatic">Dramatic</SelectItem>
                            <SelectItem value="mysterious">
                              Mysterious
                            </SelectItem>
                            <SelectItem value="energetic">Energetic</SelectItem>
                            <SelectItem value="melancholic">
                              Melancholic
                            </SelectItem>
                            <SelectItem value="joyful">Joyful</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="bright">Bright</SelectItem>
                            <SelectItem value="romantic">Romantic</SelectItem>
                            <SelectItem value="futuristic">
                              Futuristic
                            </SelectItem>
                            <SelectItem value="nostalgic">Nostalgic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Prompt Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={detailedDescriptionsId}
                            checked={includeDetailedDescriptions}
                            onCheckedChange={(checked) =>
                              setIncludeDetailedDescriptions(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={detailedDescriptionsId}
                            className="text-sm font-normal"
                          >
                            Include detailed visual descriptions
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={technicalSpecsId}
                            checked={includeTechnicalSpecs}
                            onCheckedChange={(checked) =>
                              setIncludeTechnicalSpecs(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={technicalSpecsId}
                            className="text-sm font-normal"
                          >
                            Include technical specifications
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!subject.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Art Prompt"}
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
                        onClick={regeneratePrompt}
                        disabled={
                          status === "streaming" || !subject.trim() || !result
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
                        Generated Art Prompt
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
                            ? "Analyzing art requirements..."
                            : "Generating detailed art prompt..."}
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
