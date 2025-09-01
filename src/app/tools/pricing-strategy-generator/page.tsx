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

export default function PricingStrategyGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.PRICING_STRATEGY_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const productServiceId = useId();
  const targetMarketId = useId();
  const costStructureId = useId();
  const competitiveLandscapeId = useId();
  const detailedAnalysisId = useId();
  const competitivePositioningId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [productService, setProductService] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [costStructure, setCostStructure] = useState("");
  const [competitiveLandscape, setCompetitiveLandscape] = useState("");
  const [includeDetailedAnalysis, setIncludeDetailedAnalysis] = useState(true);
  const [includeCompetitivePositioning, setIncludeCompetitivePositioning] =
    useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const productServiceRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.productService) {
        setProductService(execution.inputs.productService);
      }
      if (execution.inputs?.targetMarket) {
        setTargetMarket(execution.inputs.targetMarket);
      }
      if (execution.inputs?.costStructure) {
        setCostStructure(execution.inputs.costStructure);
      }
      if (execution.inputs?.competitiveLandscape) {
        setCompetitiveLandscape(execution.inputs.competitiveLandscape);
      }
      if (execution.inputs?.includeDetailedAnalysis !== undefined) {
        setIncludeDetailedAnalysis(execution.inputs.includeDetailedAnalysis);
      }
      if (execution.inputs?.includeCompetitivePositioning !== undefined) {
        setIncludeCompetitivePositioning(
          execution.inputs.includeCompetitivePositioning
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
    if (hasApiKey && productServiceRef.current) {
      productServiceRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setProductService("");
    setTargetMarket("");
    setCostStructure("");
    setCompetitiveLandscape("");
    setIncludeDetailedAnalysis(true);
    setIncludeCompetitivePositioning(true);
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
      !productService.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/pricing-strategy-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          productService: productService.trim(),
          targetMarket: targetMarket.trim(),
          costStructure: costStructure.trim(),
          competitiveLandscape: competitiveLandscape.trim(),
          includeDetailedAnalysis,
          includeCompetitivePositioning,
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
            productService: productService.trim(),
            targetMarket: targetMarket.trim(),
            costStructure: costStructure.trim(),
            competitiveLandscape: competitiveLandscape.trim(),
            includeDetailedAnalysis,
            includeCompetitivePositioning,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          productService: productService.trim(),
          targetMarket: targetMarket.trim(),
          costStructure: costStructure.trim(),
          competitiveLandscape: competitiveLandscape.trim(),
          includeDetailedAnalysis,
          includeCompetitivePositioning,
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
          "Sorry, an error occurred while generating pricing strategy."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    productService,
    targetMarket,
    costStructure,
    competitiveLandscape,
    includeDetailedAnalysis,
    includeCompetitivePositioning,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateStrategy = useCallback(async () => {
    if (status === "streaming" || !productService.trim()) return;
    await handleSubmit();
  }, [status, productService, handleSubmit]);

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
                productService: "",
                targetMarket: "",
                costStructure: "",
                competitiveLandscape: "",
                includeDetailedAnalysis: true,
                includeCompetitivePositioning: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Pricing Strategy Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Pricing Strategy Generator"
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
                    generate pricing strategies
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
                      <Label htmlFor={productServiceId}>
                        Product/Service *
                      </Label>
                      <Input
                        ref={productServiceRef}
                        id={productServiceId}
                        value={productService}
                        onChange={(e) => setProductService(e.target.value)}
                        placeholder="Describe your product or service in detail..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={targetMarketId}>Target Market</Label>
                      <Textarea
                        id={targetMarketId}
                        value={targetMarket}
                        onChange={(e) => setTargetMarket(e.target.value)}
                        placeholder="Describe your target market, customer segments, demographics, and buying behavior..."
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={costStructureId}>Cost Structure</Label>
                      <Textarea
                        id={costStructureId}
                        value={costStructure}
                        onChange={(e) => setCostStructure(e.target.value)}
                        placeholder="Describe your cost structure, including fixed costs, variable costs, production costs, etc..."
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={competitiveLandscapeId}>
                        Competitive Landscape
                      </Label>
                      <Textarea
                        id={competitiveLandscapeId}
                        value={competitiveLandscape}
                        onChange={(e) =>
                          setCompetitiveLandscape(e.target.value)
                        }
                        placeholder="Describe your competitors, their pricing, market positioning, and competitive advantages..."
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Strategy Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={detailedAnalysisId}
                            checked={includeDetailedAnalysis}
                            onCheckedChange={(checked) =>
                              setIncludeDetailedAnalysis(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={detailedAnalysisId}
                            className="text-sm font-normal"
                          >
                            Include detailed price optimization analysis
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={competitivePositioningId}
                            checked={includeCompetitivePositioning}
                            onCheckedChange={(checked) =>
                              setIncludeCompetitivePositioning(
                                checked as boolean
                              )
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={competitivePositioningId}
                            className="text-sm font-normal"
                          >
                            Include detailed competitive positioning strategy
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          !productService.trim() || status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Pricing Strategy"}
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
                        onClick={regenerateStrategy}
                        disabled={
                          status === "streaming" ||
                          !productService.trim() ||
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
                        Generated Pricing Strategy
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
                            ? "Analyzing market and pricing factors..."
                            : "Generating comprehensive pricing strategy..."}
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
