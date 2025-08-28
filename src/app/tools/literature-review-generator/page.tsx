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

export default function LiteratureReviewGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.LITERATURE_REVIEW_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const researchTopicId = useId();
  const sourcesId = useId();
  const researchQuestionId = useId();
  const comprehensiveAnalysisId = useId();
  const gapAnalysisId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [researchTopic, setResearchTopic] = useState("");
  const [sources, setSources] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [includeComprehensiveAnalysis, setIncludeComprehensiveAnalysis] =
    useState(true);
  const [includeGapAnalysis, setIncludeGapAnalysis] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const researchTopicRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.researchTopic) {
        setResearchTopic(execution.inputs.researchTopic);
      }
      if (execution.inputs?.sources) {
        setSources(execution.inputs.sources);
      }
      if (execution.inputs?.researchQuestion) {
        setResearchQuestion(execution.inputs.researchQuestion);
      }
      if (execution.inputs?.includeComprehensiveAnalysis !== undefined) {
        setIncludeComprehensiveAnalysis(
          execution.inputs.includeComprehensiveAnalysis
        );
      }
      if (execution.inputs?.includeGapAnalysis !== undefined) {
        setIncludeGapAnalysis(execution.inputs.includeGapAnalysis);
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
    if (hasApiKey && researchTopicRef.current) {
      researchTopicRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setResearchTopic("");
    setSources("");
    setResearchQuestion("");
    setIncludeComprehensiveAnalysis(true);
    setIncludeGapAnalysis(true);
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
      !researchTopic.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/literature-review-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          researchTopic: researchTopic.trim(),
          sources: sources.trim(),
          researchQuestion: researchQuestion.trim(),
          includeComprehensiveAnalysis,
          includeGapAnalysis,
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
            researchTopic: researchTopic.trim(),
            sources: sources.trim(),
            researchQuestion: researchQuestion.trim(),
            includeComprehensiveAnalysis,
            includeGapAnalysis,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          researchTopic: researchTopic.trim(),
          sources: sources.trim(),
          researchQuestion: researchQuestion.trim(),
          includeComprehensiveAnalysis,
          includeGapAnalysis,
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
          "Sorry, an error occurred while generating literature review."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    researchTopic,
    sources,
    researchQuestion,
    includeComprehensiveAnalysis,
    includeGapAnalysis,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateReview = useCallback(async () => {
    if (status === "streaming" || !researchTopic.trim()) return;
    await handleSubmit();
  }, [status, researchTopic, handleSubmit]);

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
                researchTopic: "",
                sources: "",
                researchQuestion: "",
                includeComprehensiveAnalysis: true,
                includeGapAnalysis: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Literature Review Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Literature Review Generator"
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
                    generate literature reviews
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
                      <Label htmlFor={researchTopicId}>Research Topic *</Label>
                      <Input
                        ref={researchTopicRef}
                        id={researchTopicId}
                        value={researchTopic}
                        onChange={(e) => setResearchTopic(e.target.value)}
                        placeholder="e.g., Artificial Intelligence in Healthcare, Climate Change Impact on Agriculture..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={sourcesId}>
                        Academic Sources (Optional)
                      </Label>
                      <Textarea
                        id={sourcesId}
                        value={sources}
                        onChange={(e) => setSources(e.target.value)}
                        placeholder="List or describe the academic sources, papers, or research you want to include in the review..."
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={researchQuestionId}>
                        Research Question (Optional)
                      </Label>
                      <Textarea
                        id={researchQuestionId}
                        value={researchQuestion}
                        onChange={(e) => setResearchQuestion(e.target.value)}
                        placeholder="What specific research question or hypothesis are you investigating?"
                        rows={2}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Review Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={comprehensiveAnalysisId}
                            checked={includeComprehensiveAnalysis}
                            onCheckedChange={(checked) =>
                              setIncludeComprehensiveAnalysis(
                                checked as boolean
                              )
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={comprehensiveAnalysisId}
                            className="text-sm font-normal"
                          >
                            Include comprehensive critical analysis of sources
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={gapAnalysisId}
                            checked={includeGapAnalysis}
                            onCheckedChange={(checked) =>
                              setIncludeGapAnalysis(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={gapAnalysisId}
                            className="text-sm font-normal"
                          >
                            Include research gap analysis and future directions
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          !researchTopic.trim() || status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Literature Review"}
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
                        onClick={regenerateReview}
                        disabled={
                          status === "streaming" ||
                          !researchTopic.trim() ||
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
                        Generated Literature Review
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
                            ? "Analyzing research topic and sources..."
                            : "Generating comprehensive literature review..."}
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
