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

export default function KpiDashboardDesignerPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.KPI_DASHBOARD_DESIGNER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const businessTypeId = useId();
  const goalsId = useId();
  const metricsId = useId();
  const detailedDashboardId = useId();
  const implementationGuidanceId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [businessType, setBusinessType] = useState("general");
  const [goals, setGoals] = useState("");
  const [metrics, setMetrics] = useState("");
  const [includeDetailedDashboard, setIncludeDetailedDashboard] =
    useState(true);
  const [includeImplementationGuidance, setIncludeImplementationGuidance] =
    useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const businessTypeRef = useRef<HTMLSelectElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.businessType) {
        setBusinessType(execution.inputs.businessType);
      }
      if (execution.inputs?.goals) {
        setGoals(execution.inputs.goals);
      }
      if (execution.inputs?.metrics) {
        setMetrics(execution.inputs.metrics);
      }
      if (execution.inputs?.includeDetailedDashboard !== undefined) {
        setIncludeDetailedDashboard(execution.inputs.includeDetailedDashboard);
      }
      if (execution.inputs?.includeImplementationGuidance !== undefined) {
        setIncludeImplementationGuidance(
          execution.inputs.includeImplementationGuidance
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
    if (hasApiKey && businessTypeRef.current) {
      businessTypeRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setBusinessType("general");
    setGoals("");
    setMetrics("");
    setIncludeDetailedDashboard(true);
    setIncludeImplementationGuidance(true);
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
    if (!hasApiKey || status === "submitted" || status === "streaming") return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/kpi-dashboard-designer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          businessType,
          goals: goals.trim(),
          metrics: metrics.trim(),
          includeDetailedDashboard,
          includeImplementationGuidance,
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
            businessType,
            goals: goals.trim(),
            metrics: metrics.trim(),
            includeDetailedDashboard,
            includeImplementationGuidance,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          businessType,
          goals: goals.trim(),
          metrics: metrics.trim(),
          includeDetailedDashboard,
          includeImplementationGuidance,
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
          "Sorry, an error occurred while generating KPI dashboard design."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    businessType,
    goals,
    metrics,
    includeDetailedDashboard,
    includeImplementationGuidance,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateDesign = useCallback(async () => {
    if (status === "streaming") return;
    await handleSubmit();
  }, [status, handleSubmit]);

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
                businessType: "general",
                goals: "",
                metrics: "",
                includeDetailedDashboard: true,
                includeImplementationGuidance: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="KPI Dashboard Designer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="KPI Dashboard Designer"
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
                    generate KPI dashboard designs
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
                      <Label htmlFor={businessTypeId}>Business Type</Label>
                      <Select
                        value={businessType}
                        onValueChange={setBusinessType}
                      >
                        <SelectTrigger ref={businessTypeRef}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">
                            General Business
                          </SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="saas">SaaS/Software</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">
                            Manufacturing
                          </SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">
                            Finance/Banking
                          </SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={goalsId}>Business Goals</Label>
                      <Textarea
                        id={goalsId}
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        placeholder="What are your main business goals? (e.g., Increase revenue by 20%, Improve customer satisfaction, Reduce operational costs...)"
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={metricsId}>
                        Current Metrics (Optional)
                      </Label>
                      <Textarea
                        id={metricsId}
                        value={metrics}
                        onChange={(e) => setMetrics(e.target.value)}
                        placeholder="What metrics are you currently tracking or want to track? (e.g., Revenue, Customer acquisition cost, Conversion rates...)"
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Design Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={detailedDashboardId}
                            checked={includeDetailedDashboard}
                            onCheckedChange={(checked) =>
                              setIncludeDetailedDashboard(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={detailedDashboardId}
                            className="text-sm font-normal"
                          >
                            Include detailed dashboard structure and layout
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={implementationGuidanceId}
                            checked={includeImplementationGuidance}
                            onCheckedChange={(checked) =>
                              setIncludeImplementationGuidance(
                                checked as boolean
                              )
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={implementationGuidanceId}
                            className="text-sm font-normal"
                          >
                            Include implementation guidance and technology
                            recommendations
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={status === "streaming"}>
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate KPI Dashboard Design"}
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
                        onClick={regenerateDesign}
                        disabled={status === "streaming" || !result}
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
                        Generated KPI Dashboard Design
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
                            ? "Analyzing business requirements..."
                            : "Generating comprehensive KPI dashboard design..."}
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
