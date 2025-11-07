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

export default function BusinessPlanGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.BUSINESS_PLAN_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const businessIdeaId = useId();
  const industryId = useId();
  const targetMarketId = useId();
  const fundingNeedsId = useId();
  const financialProjectionsId = useId();
  const marketAnalysisId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [businessIdea, setBusinessIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [fundingNeeds, setFundingNeeds] = useState("");
  const [includeFinancialProjections, setIncludeFinancialProjections] =
    useState(true);
  const [includeMarketAnalysis, setIncludeMarketAnalysis] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const businessIdeaRef = useRef<HTMLTextAreaElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.businessIdea) {
        setBusinessIdea(execution.inputs.businessIdea);
      }
      if (execution.inputs?.industry) {
        setIndustry(execution.inputs.industry);
      }
      if (execution.inputs?.targetMarket) {
        setTargetMarket(execution.inputs.targetMarket);
      }
      if (execution.inputs?.fundingNeeds) {
        setFundingNeeds(execution.inputs.fundingNeeds);
      }
      if (execution.inputs?.includeFinancialProjections !== undefined) {
        setIncludeFinancialProjections(
          execution.inputs.includeFinancialProjections
        );
      }
      if (execution.inputs?.includeMarketAnalysis !== undefined) {
        setIncludeMarketAnalysis(execution.inputs.includeMarketAnalysis);
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
    if (hasApiKey && businessIdeaRef.current) {
      businessIdeaRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setBusinessIdea("");
    setIndustry("");
    setTargetMarket("");
    setFundingNeeds("");
    setIncludeFinancialProjections(true);
    setIncludeMarketAnalysis(true);
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
      !businessIdea.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/business-plan-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          businessIdea: businessIdea.trim(),
          industry: industry.trim(),
          targetMarket: targetMarket.trim(),
          fundingNeeds: fundingNeeds.trim(),
          includeFinancialProjections,
          includeMarketAnalysis,
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
            businessIdea: businessIdea.trim(),
            industry: industry.trim(),
            targetMarket: targetMarket.trim(),
            fundingNeeds: fundingNeeds.trim(),
            includeFinancialProjections,
            includeMarketAnalysis,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          businessIdea: businessIdea.trim(),
          industry: industry.trim(),
          targetMarket: targetMarket.trim(),
          fundingNeeds: fundingNeeds.trim(),
          includeFinancialProjections,
          includeMarketAnalysis,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating business plan.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    businessIdea,
    industry,
    targetMarket,
    fundingNeeds,
    includeFinancialProjections,
    includeMarketAnalysis,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regeneratePlan = useCallback(async () => {
    if (status === "streaming" || !businessIdea.trim()) return;
    await handleSubmit();
  }, [status, businessIdea, handleSubmit]);

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
                businessIdea: "",
                industry: "",
                targetMarket: "",
                fundingNeeds: "",
                includeFinancialProjections: true,
                includeMarketAnalysis: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Business Plan Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Business Plan Generator"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate business plans
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
                      <Label htmlFor={businessIdeaId}>Business Idea *</Label>
                      <Textarea
                        ref={businessIdeaRef}
                        id={businessIdeaId}
                        value={businessIdea}
                        onChange={(e) => setBusinessIdea(e.target.value)}
                        placeholder="Describe your business idea, concept, or venture..."
                        rows={4}
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
                          placeholder="Technology, Healthcare, Finance, Retail..."
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={targetMarketId}>Target Market</Label>
                        <Input
                          id={targetMarketId}
                          value={targetMarket}
                          onChange={(e) => setTargetMarket(e.target.value)}
                          placeholder="Young professionals, small businesses, parents..."
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={fundingNeedsId}>
                        Funding Needs (Optional)
                      </Label>
                      <Input
                        id={fundingNeedsId}
                        value={fundingNeeds}
                        onChange={(e) => setFundingNeeds(e.target.value)}
                        placeholder="e.g., $50,000 for initial development, $200,000 for expansion..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Business Plan Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={financialProjectionsId}
                            checked={includeFinancialProjections}
                            onCheckedChange={(checked) =>
                              setIncludeFinancialProjections(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={financialProjectionsId}
                            className="text-sm font-normal"
                          >
                            Include financial projections and analysis
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={marketAnalysisId}
                            checked={includeMarketAnalysis}
                            onCheckedChange={(checked) =>
                              setIncludeMarketAnalysis(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={marketAnalysisId}
                            className="text-sm font-normal"
                          >
                            Include detailed market analysis
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          !businessIdea.trim() || status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Business Plan"}
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
                        onClick={regeneratePlan}
                        disabled={
                          status === "streaming" ||
                          !businessIdea.trim() ||
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
                        Generated Business Plan
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
                            ? "Analyzing business concept..."
                            : "Generating comprehensive business plan..."}
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
