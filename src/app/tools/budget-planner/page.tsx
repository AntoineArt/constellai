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

export default function BudgetPlannerPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.BUDGET_PLANNER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const budgetTypeId = useId();
  const totalBudgetId = useId();
  const categoriesId = useId();
  const timePeriodId = useId();
  const detailedBreakdownId = useId();
  const forecastingId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [budgetType, setBudgetType] = useState("general");
  const [totalBudget, setTotalBudget] = useState("");
  const [categories, setCategories] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [includeDetailedBreakdown, setIncludeDetailedBreakdown] =
    useState(true);
  const [includeForecasting, setIncludeForecasting] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const budgetTypeRef = useRef<HTMLButtonElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.budgetType) {
        setBudgetType(execution.inputs.budgetType);
      }
      if (execution.inputs?.totalBudget) {
        setTotalBudget(execution.inputs.totalBudget);
      }
      if (execution.inputs?.categories) {
        setCategories(execution.inputs.categories);
      }
      if (execution.inputs?.timePeriod) {
        setTimePeriod(execution.inputs.timePeriod);
      }
      if (execution.inputs?.includeDetailedBreakdown !== undefined) {
        setIncludeDetailedBreakdown(execution.inputs.includeDetailedBreakdown);
      }
      if (execution.inputs?.includeForecasting !== undefined) {
        setIncludeForecasting(execution.inputs.includeForecasting);
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
    if (hasApiKey && budgetTypeRef.current) {
      budgetTypeRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setBudgetType("general");
    setTotalBudget("");
    setCategories("");
    setTimePeriod("");
    setIncludeDetailedBreakdown(true);
    setIncludeForecasting(true);
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
      !totalBudget.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/budget-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          budgetType,
          totalBudget: totalBudget.trim(),
          categories: categories.trim(),
          timePeriod: timePeriod.trim(),
          includeDetailedBreakdown,
          includeForecasting,
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
            budgetType,
            totalBudget: totalBudget.trim(),
            categories: categories.trim(),
            timePeriod: timePeriod.trim(),
            includeDetailedBreakdown,
            includeForecasting,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          budgetType,
          totalBudget: totalBudget.trim(),
          categories: categories.trim(),
          timePeriod: timePeriod.trim(),
          includeDetailedBreakdown,
          includeForecasting,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating budget plan.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    budgetType,
    totalBudget,
    categories,
    timePeriod,
    includeDetailedBreakdown,
    includeForecasting,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regeneratePlan = useCallback(async () => {
    if (status === "streaming" || !totalBudget.trim()) return;
    await handleSubmit();
  }, [status, totalBudget, handleSubmit]);

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
                budgetType: "general",
                totalBudget: "",
                categories: "",
                timePeriod: "",
                includeDetailedBreakdown: true,
                includeForecasting: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Budget Planner"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Budget Planner"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate budget plans
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
                      <Label htmlFor={budgetTypeId}>Budget Type</Label>
                      <Select value={budgetType} onValueChange={setBudgetType}>
                        <SelectTrigger ref={budgetTypeRef}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">
                            General Budget
                          </SelectItem>
                          <SelectItem value="business">
                            Business Budget
                          </SelectItem>
                          <SelectItem value="marketing">
                            Marketing Budget
                          </SelectItem>
                          <SelectItem value="project">
                            Project Budget
                          </SelectItem>
                          <SelectItem value="department">
                            Department Budget
                          </SelectItem>
                          <SelectItem value="startup">
                            Startup Budget
                          </SelectItem>
                          <SelectItem value="event">Event Budget</SelectItem>
                          <SelectItem value="campaign">
                            Campaign Budget
                          </SelectItem>
                          <SelectItem value="annual">Annual Budget</SelectItem>
                          <SelectItem value="quarterly">
                            Quarterly Budget
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={totalBudgetId}>Total Budget *</Label>
                        <Input
                          id={totalBudgetId}
                          value={totalBudget}
                          onChange={(e) => setTotalBudget(e.target.value)}
                          placeholder="e.g., $100,000, €50,000, £75,000..."
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={timePeriodId}>Time Period</Label>
                        <Input
                          id={timePeriodId}
                          value={timePeriod}
                          onChange={(e) => setTimePeriod(e.target.value)}
                          placeholder="e.g., 1 year, 6 months, Q1 2024..."
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={categoriesId}>Budget Categories</Label>
                      <Textarea
                        id={categoriesId}
                        value={categories}
                        onChange={(e) => setCategories(e.target.value)}
                        placeholder="List your budget categories or areas of focus (e.g., Personnel, Marketing, Technology, Operations, etc.)"
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Planning Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={detailedBreakdownId}
                            checked={includeDetailedBreakdown}
                            onCheckedChange={(checked) =>
                              setIncludeDetailedBreakdown(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={detailedBreakdownId}
                            className="text-sm font-normal"
                          >
                            Include detailed line-item budget breakdown
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={forecastingId}
                            checked={includeForecasting}
                            onCheckedChange={(checked) =>
                              setIncludeForecasting(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={forecastingId}
                            className="text-sm font-normal"
                          >
                            Include financial forecasting and projections
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!totalBudget.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Budget Plan"}
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
                          !totalBudget.trim() ||
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
                        Generated Budget Plan
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
                            ? "Analyzing budget requirements..."
                            : "Generating comprehensive budget plan..."}
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
