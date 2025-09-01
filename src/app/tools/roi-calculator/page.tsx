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

export default function RoiCalculatorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.ROI_CALCULATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const investmentTypeId = useId();
  const initialInvestmentId = useId();
  const expectedReturnsId = useId();
  const timePeriodId = useId();
  const additionalCostsId = useId();
  const detailedAnalysisId = useId();
  const recommendationsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [investmentType, setInvestmentType] = useState("general");
  const [initialInvestment, setInitialInvestment] = useState("");
  const [expectedReturns, setExpectedReturns] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState("");
  const [includeDetailedAnalysis, setIncludeDetailedAnalysis] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const investmentTypeRef = useRef<HTMLButtonElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.investmentType) {
        setInvestmentType(execution.inputs.investmentType);
      }
      if (execution.inputs?.initialInvestment) {
        setInitialInvestment(execution.inputs.initialInvestment);
      }
      if (execution.inputs?.expectedReturns) {
        setExpectedReturns(execution.inputs.expectedReturns);
      }
      if (execution.inputs?.timePeriod) {
        setTimePeriod(execution.inputs.timePeriod);
      }
      if (execution.inputs?.additionalCosts) {
        setAdditionalCosts(execution.inputs.additionalCosts);
      }
      if (execution.inputs?.includeDetailedAnalysis !== undefined) {
        setIncludeDetailedAnalysis(execution.inputs.includeDetailedAnalysis);
      }
      if (execution.inputs?.includeRecommendations !== undefined) {
        setIncludeRecommendations(execution.inputs.includeRecommendations);
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
    if (hasApiKey && investmentTypeRef.current) {
      investmentTypeRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setInvestmentType("general");
    setInitialInvestment("");
    setExpectedReturns("");
    setTimePeriod("");
    setAdditionalCosts("");
    setIncludeDetailedAnalysis(true);
    setIncludeRecommendations(true);
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
      !initialInvestment.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/roi-calculator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          investmentType,
          initialInvestment: initialInvestment.trim(),
          expectedReturns: expectedReturns.trim(),
          timePeriod: timePeriod.trim(),
          additionalCosts: additionalCosts.trim(),
          includeDetailedAnalysis,
          includeRecommendations,
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
            investmentType,
            initialInvestment: initialInvestment.trim(),
            expectedReturns: expectedReturns.trim(),
            timePeriod: timePeriod.trim(),
            additionalCosts: additionalCosts.trim(),
            includeDetailedAnalysis,
            includeRecommendations,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          investmentType,
          initialInvestment: initialInvestment.trim(),
          expectedReturns: expectedReturns.trim(),
          timePeriod: timePeriod.trim(),
          additionalCosts: additionalCosts.trim(),
          includeDetailedAnalysis,
          includeRecommendations,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating ROI analysis.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    investmentType,
    initialInvestment,
    expectedReturns,
    timePeriod,
    additionalCosts,
    includeDetailedAnalysis,
    includeRecommendations,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateAnalysis = useCallback(async () => {
    if (status === "streaming" || !initialInvestment.trim()) return;
    await handleSubmit();
  }, [status, initialInvestment, handleSubmit]);

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
                investmentType: "general",
                initialInvestment: "",
                expectedReturns: "",
                timePeriod: "",
                additionalCosts: "",
                includeDetailedAnalysis: true,
                includeRecommendations: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="ROI Calculator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="ROI Calculator"
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
                    generate ROI analysis
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
                      <Label htmlFor={investmentTypeId}>Investment Type</Label>
                      <Select
                        value={investmentType}
                        onValueChange={setInvestmentType}
                      >
                        <SelectTrigger ref={investmentTypeRef}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">
                            General Investment
                          </SelectItem>
                          <SelectItem value="business">
                            Business Investment
                          </SelectItem>
                          <SelectItem value="marketing">
                            Marketing Campaign
                          </SelectItem>
                          <SelectItem value="technology">
                            Technology Investment
                          </SelectItem>
                          <SelectItem value="real-estate">
                            Real Estate
                          </SelectItem>
                          <SelectItem value="equipment">
                            Equipment Purchase
                          </SelectItem>
                          <SelectItem value="training">
                            Training & Development
                          </SelectItem>
                          <SelectItem value="research">
                            Research & Development
                          </SelectItem>
                          <SelectItem value="expansion">
                            Business Expansion
                          </SelectItem>
                          <SelectItem value="startup">
                            Startup Investment
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={initialInvestmentId}>
                          Initial Investment *
                        </Label>
                        <Input
                          id={initialInvestmentId}
                          value={initialInvestment}
                          onChange={(e) => setInitialInvestment(e.target.value)}
                          placeholder="e.g., $50,000, €30,000, £25,000..."
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={timePeriodId}>Time Period</Label>
                        <Input
                          id={timePeriodId}
                          value={timePeriod}
                          onChange={(e) => setTimePeriod(e.target.value)}
                          placeholder="e.g., 1 year, 3 years, 6 months..."
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={expectedReturnsId}>
                        Expected Returns
                      </Label>
                      <Textarea
                        id={expectedReturnsId}
                        value={expectedReturns}
                        onChange={(e) => setExpectedReturns(e.target.value)}
                        placeholder="Describe expected returns, revenue increases, cost savings, or other benefits..."
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={additionalCostsId}>
                        Additional Costs (Optional)
                      </Label>
                      <Textarea
                        id={additionalCostsId}
                        value={additionalCosts}
                        onChange={(e) => setAdditionalCosts(e.target.value)}
                        placeholder="Include ongoing costs, maintenance, operational expenses, or other costs..."
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Analysis Options</Label>
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
                            Include detailed risk and sensitivity analysis
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={recommendationsId}
                            checked={includeRecommendations}
                            onCheckedChange={(checked) =>
                              setIncludeRecommendations(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={recommendationsId}
                            className="text-sm font-normal"
                          >
                            Include investment recommendations and optimization
                            strategies
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          !initialInvestment.trim() || status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate ROI Analysis"}
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
                        onClick={regenerateAnalysis}
                        disabled={
                          status === "streaming" ||
                          !initialInvestment.trim() ||
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
                        Generated ROI Analysis
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
                            ? "Analyzing investment parameters..."
                            : "Generating comprehensive ROI analysis..."}
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
