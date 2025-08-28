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

export default function MarketResearchSynthesizerPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.MARKET_RESEARCH_SYNTHESIZER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const researchTopicId = useId();
  const dataSourcesId = useId();
  const targetMarketId = useId();
  const competitiveAnalysisId = useId();
  const actionableInsightsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [researchTopic, setResearchTopic] = useState("");
  const [dataSources, setDataSources] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [includeCompetitiveAnalysis, setIncludeCompetitiveAnalysis] =
    useState(true);
  const [includeActionableInsights, setIncludeActionableInsights] =
    useState(true);
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
      if (execution.inputs?.dataSources) {
        setDataSources(execution.inputs.dataSources);
      }
      if (execution.inputs?.targetMarket) {
        setTargetMarket(execution.inputs.targetMarket);
      }
      if (execution.inputs?.includeCompetitiveAnalysis !== undefined) {
        setIncludeCompetitiveAnalysis(
          execution.inputs.includeCompetitiveAnalysis
        );
      }
      if (execution.inputs?.includeActionableInsights !== undefined) {
        setIncludeActionableInsights(
          execution.inputs.includeActionableInsights
        );
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
    setDataSources("");
    setTargetMarket("");
    setIncludeCompetitiveAnalysis(true);
    setIncludeActionableInsights(true);
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

      const response = await fetch("/api/market-research-synthesizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          researchTopic: researchTopic.trim(),
          dataSources: dataSources.trim(),
          targetMarket: targetMarket.trim(),
          includeCompetitiveAnalysis,
          includeActionableInsights,
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
            dataSources: dataSources.trim(),
            targetMarket: targetMarket.trim(),
            includeCompetitiveAnalysis,
            includeActionableInsights,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          researchTopic: researchTopic.trim(),
          dataSources: dataSources.trim(),
          targetMarket: targetMarket.trim(),
          includeCompetitiveAnalysis,
          includeActionableInsights,
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
          "Sorry, an error occurred while generating market research synthesis."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    researchTopic,
    dataSources,
    targetMarket,
    includeCompetitiveAnalysis,
    includeActionableInsights,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateSynthesis = useCallback(async () => {
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
                dataSources: "",
                targetMarket: "",
                includeCompetitiveAnalysis: true,
                includeActionableInsights: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Market Research Synthesizer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Market Research Synthesizer"
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
                    generate market research synthesis
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
                        placeholder="e.g., E-commerce market analysis, SaaS industry trends, Mobile app market..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={dataSourcesId}>
                        Data Sources (Optional)
                      </Label>
                      <Textarea
                        id={dataSourcesId}
                        value={dataSources}
                        onChange={(e) => setDataSources(e.target.value)}
                        placeholder="Describe the data sources, research methods, or specific data you want to analyze..."
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={targetMarketId}>
                        Target Market (Optional)
                      </Label>
                      <Input
                        id={targetMarketId}
                        value={targetMarket}
                        onChange={(e) => setTargetMarket(e.target.value)}
                        placeholder="e.g., Small businesses, Millennials, Enterprise customers, Global market..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Analysis Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={competitiveAnalysisId}
                            checked={includeCompetitiveAnalysis}
                            onCheckedChange={(checked) =>
                              setIncludeCompetitiveAnalysis(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={competitiveAnalysisId}
                            className="text-sm font-normal"
                          >
                            Include competitive landscape analysis
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={actionableInsightsId}
                            checked={includeActionableInsights}
                            onCheckedChange={(checked) =>
                              setIncludeActionableInsights(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={actionableInsightsId}
                            className="text-sm font-normal"
                          >
                            Include actionable strategic recommendations
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
                          : "Generate Market Research Synthesis"}
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
                        onClick={regenerateSynthesis}
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
                        Generated Market Research Synthesis
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
                            ? "Analyzing market research requirements..."
                            : "Generating comprehensive market research synthesis..."}
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
