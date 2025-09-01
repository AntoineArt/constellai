"use client";

import { useCallback, useRef, useState, useEffect, useId } from "react";
import type { ChatStatus } from "ai";

import { TopBar } from "@/components/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ToolHistorySidebar } from "@/components/tool-history-sidebar";
import { useApiKey } from "@/hooks/use-api-key";
import { useToolHistory, usePreferences, TOOL_IDS } from "@/lib/storage";
import { Copy, RotateCcw, Trash2 } from "lucide-react";
import { Response } from "@/components/ai-elements/response";

export default function PressReleaseWriterPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.PRESS_RELEASE_WRITER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const headlineId = useId();
  const companyId = useId();
  const announcementId = useId();
  const keyPointsId = useId();
  const targetMediaId = useId();
  const quotesId = useId();
  const boilerplateId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [headline, setHeadline] = useState("");
  const [company, setCompany] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [targetMedia, setTargetMedia] = useState("");
  const [includeQuotes, setIncludeQuotes] = useState(true);
  const [includeBoilerplate, setIncludeBoilerplate] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const headlineRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.headline) {
        setHeadline(execution.inputs.headline);
      }
      if (execution.inputs?.company) {
        setCompany(execution.inputs.company);
      }
      if (execution.inputs?.announcement) {
        setAnnouncement(execution.inputs.announcement);
      }
      if (execution.inputs?.keyPoints) {
        setKeyPoints(execution.inputs.keyPoints);
      }
      if (execution.inputs?.targetMedia) {
        setTargetMedia(execution.inputs.targetMedia);
      }
      if (execution.inputs?.includeQuotes !== undefined) {
        setIncludeQuotes(execution.inputs.includeQuotes);
      }
      if (execution.inputs?.includeBoilerplate !== undefined) {
        setIncludeBoilerplate(execution.inputs.includeBoilerplate);
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
    if (hasApiKey && headlineRef.current) {
      headlineRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setHeadline("");
    setCompany("");
    setAnnouncement("");
    setKeyPoints("");
    setTargetMedia("");
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
      (!headline.trim() && !announcement.trim())
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/press-release-writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          headline: headline.trim(),
          company: company.trim(),
          announcement: announcement.trim(),
          keyPoints: keyPoints.trim(),
          targetMedia: targetMedia.trim(),
          includeQuotes,
          includeBoilerplate,
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
            headline: headline.trim(),
            company: company.trim(),
            announcement: announcement.trim(),
            keyPoints: keyPoints.trim(),
            targetMedia: targetMedia.trim(),
            includeQuotes,
            includeBoilerplate,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          headline: headline.trim(),
          company: company.trim(),
          announcement: announcement.trim(),
          keyPoints: keyPoints.trim(),
          targetMedia: targetMedia.trim(),
          includeQuotes,
          includeBoilerplate,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult(
          "Sorry, an error occurred while generating the press release."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    headline,
    company,
    announcement,
    keyPoints,
    targetMedia,
    includeQuotes,
    includeBoilerplate,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateRelease = useCallback(async () => {
    if (status === "streaming" || (!headline.trim() && !announcement.trim()))
      return;
    await handleSubmit();
  }, [status, headline, announcement, handleSubmit]);

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
                headline: "",
                company: "",
                announcement: "",
                keyPoints: "",
                targetMedia: "",
                includeQuotes: true,
                includeBoilerplate: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Press Release Writer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Press Release Writer"
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
                    generate press releases
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
                      <Label htmlFor={headlineId}>Headline</Label>
                      <Input
                        ref={headlineRef}
                        id={headlineId}
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="e.g., TechCorp Launches Revolutionary AI Platform..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={companyId}>Company Name</Label>
                        <Input
                          id={companyId}
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g., TechCorp Inc."
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={targetMediaId}>Target Media</Label>
                        <Input
                          id={targetMediaId}
                          value={targetMedia}
                          onChange={(e) => setTargetMedia(e.target.value)}
                          placeholder="e.g., Tech publications, Business journals..."
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={announcementId}>Announcement *</Label>
                      <Textarea
                        id={announcementId}
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="Describe the main announcement, product launch, or news..."
                        className="min-h-[100px] max-h-[200px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={keyPointsId}>Key Points (Optional)</Label>
                      <Textarea
                        id={keyPointsId}
                        value={keyPoints}
                        onChange={(e) => setKeyPoints(e.target.value)}
                        placeholder="List key features, benefits, or important details to highlight..."
                        className="min-h-[80px] max-h-[150px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Press Release Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={quotesId}
                            checked={includeQuotes}
                            onCheckedChange={(checked) =>
                              setIncludeQuotes(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={quotesId}
                            className="text-sm font-normal"
                          >
                            Include executive quotes and statements
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={boilerplateId}
                            checked={includeBoilerplate}
                            onCheckedChange={(checked) =>
                              setIncludeBoilerplate(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={boilerplateId}
                            className="text-sm font-normal"
                          >
                            Include company boilerplate information
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          (!headline.trim() && !announcement.trim()) ||
                          status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Press Release"}
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
                        onClick={regenerateRelease}
                        disabled={
                          status === "streaming" ||
                          (!headline.trim() && !announcement.trim()) ||
                          !result
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
                        Generated Press Release
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
                            ? "Analyzing announcement details..."
                            : "Generating press release..."}
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
