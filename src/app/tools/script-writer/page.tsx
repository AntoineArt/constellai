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

export default function ScriptWriterPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.SCRIPT_WRITER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const topicId = useId();
  const targetAudienceId = useId();
  const visualCuesId = useId();
  const timingId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [scriptType, setScriptType] = useState("video");
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [duration, setDuration] = useState("5-minutes");
  const [tone, setTone] = useState("professional");
  const [includeVisualCues, setIncludeVisualCues] = useState(true);
  const [includeTiming, setIncludeTiming] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const topicRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.scriptType) {
        setScriptType(execution.inputs.scriptType);
      }
      if (execution.inputs?.topic) {
        setTopic(execution.inputs.topic);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.duration) {
        setDuration(execution.inputs.duration);
      }
      if (execution.inputs?.tone) {
        setTone(execution.inputs.tone);
      }
      if (execution.inputs?.includeVisualCues !== undefined) {
        setIncludeVisualCues(execution.inputs.includeVisualCues);
      }
      if (execution.inputs?.includeTiming !== undefined) {
        setIncludeTiming(execution.inputs.includeTiming);
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
    if (hasApiKey && topicRef.current) {
      topicRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setScriptType("video");
    setTopic("");
    setTargetAudience("");
    setDuration("5-minutes");
    setTone("professional");
    setIncludeVisualCues(true);
    setIncludeTiming(true);
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
      !topic.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/script-writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          scriptType,
          topic: topic.trim(),
          targetAudience: targetAudience.trim(),
          duration,
          tone,
          includeVisualCues,
          includeTiming,
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
            scriptType,
            topic: topic.trim(),
            targetAudience: targetAudience.trim(),
            duration,
            tone,
            includeVisualCues,
            includeTiming,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          scriptType,
          topic: topic.trim(),
          targetAudience: targetAudience.trim(),
          duration,
          tone,
          includeVisualCues,
          includeTiming,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating the script.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    scriptType,
    topic,
    targetAudience,
    duration,
    tone,
    includeVisualCues,
    includeTiming,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateScript = useCallback(async () => {
    if (status === "streaming" || !topic.trim()) return;
    await handleSubmit();
  }, [status, topic, handleSubmit]);

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
                scriptType: "video",
                topic: "",
                targetAudience: "",
                duration: "5-minutes",
                tone: "professional",
                includeVisualCues: true,
                includeTiming: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Script Writer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Script Writer"
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
                    generate scripts
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Script Type</Label>
                        <Select
                          value={scriptType}
                          onValueChange={setScriptType}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">Video Script</SelectItem>
                            <SelectItem value="presentation">
                              Presentation Script
                            </SelectItem>
                            <SelectItem value="podcast">
                              Podcast Script
                            </SelectItem>
                            <SelectItem value="commercial">
                              Commercial Script
                            </SelectItem>
                            <SelectItem value="tutorial">
                              Tutorial Script
                            </SelectItem>
                            <SelectItem value="interview">
                              Interview Script
                            </SelectItem>
                            <SelectItem value="webinar">
                              Webinar Script
                            </SelectItem>
                            <SelectItem value="speech">
                              Speech Script
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={topicId}>Topic/Subject *</Label>
                        <Input
                          ref={topicRef}
                          id={topicId}
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="What is your script about?"
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={targetAudienceId}>
                          Target Audience
                        </Label>
                        <Input
                          id={targetAudienceId}
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="Who is your audience?"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Select value={duration} onValueChange={setDuration}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-minute">1 Minute</SelectItem>
                            <SelectItem value="3-minutes">3 Minutes</SelectItem>
                            <SelectItem value="5-minutes">5 Minutes</SelectItem>
                            <SelectItem value="10-minutes">
                              10 Minutes
                            </SelectItem>
                            <SelectItem value="15-minutes">
                              15 Minutes
                            </SelectItem>
                            <SelectItem value="30-minutes">
                              30 Minutes
                            </SelectItem>
                            <SelectItem value="60-minutes">
                              60 Minutes
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">
                            Professional
                          </SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="enthusiastic">
                            Enthusiastic
                          </SelectItem>
                          <SelectItem value="authoritative">
                            Authoritative
                          </SelectItem>
                          <SelectItem value="conversational">
                            Conversational
                          </SelectItem>
                          <SelectItem value="humorous">Humorous</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Script Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={visualCuesId}
                            checked={includeVisualCues}
                            onCheckedChange={(checked) =>
                              setIncludeVisualCues(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={visualCuesId}
                            className="text-sm font-normal"
                          >
                            Include visual cues and directions
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={timingId}
                            checked={includeTiming}
                            onCheckedChange={(checked) =>
                              setIncludeTiming(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={timingId}
                            className="text-sm font-normal"
                          >
                            Include timing and pacing notes
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!topic.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Script"}
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
                        onClick={regenerateScript}
                        disabled={
                          status === "streaming" || !topic.trim() || !result
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
                        Generated Script
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
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                        {result}
                      </pre>
                    </div>
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
                            ? "Analyzing script requirements..."
                            : "Generating professional script..."}
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
