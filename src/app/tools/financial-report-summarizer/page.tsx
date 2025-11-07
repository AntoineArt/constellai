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

export default function FinancialReportSummarizerPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.FINANCIAL_REPORT_SUMMARIZER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const companyNameId = useId();
  const reportTypeId = useId();
  const financialDataId = useId();
  const keyInsightsId = useId();
  const recommendationsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [companyName, setCompanyName] = useState("");
  const [reportType, setReportType] = useState("quarterly");
  const [financialData, setFinancialData] = useState("");
  const [includeKeyInsights, setIncludeKeyInsights] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const companyNameRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.companyName) {
        setCompanyName(execution.inputs.companyName);
      }
      if (execution.inputs?.reportType) {
        setReportType(execution.inputs.reportType);
      }
      if (execution.inputs?.financialData) {
        setFinancialData(execution.inputs.financialData);
      }
      if (execution.inputs?.includeKeyInsights !== undefined) {
        setIncludeKeyInsights(execution.inputs.includeKeyInsights);
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
    if (hasApiKey && companyNameRef.current) {
      companyNameRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setCompanyName("");
    setReportType("quarterly");
    setFinancialData("");
    setIncludeKeyInsights(true);
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
      !companyName.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/financial-report-summarizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          companyName: companyName.trim(),
          reportType,
          financialData: financialData.trim(),
          includeKeyInsights,
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
            companyName: companyName.trim(),
            reportType,
            financialData: financialData.trim(),
            includeKeyInsights,
            includeRecommendations,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          companyName: companyName.trim(),
          reportType,
          financialData: financialData.trim(),
          includeKeyInsights,
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
        setResult(
          "Sorry, an error occurred while generating financial report summary."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    companyName,
    reportType,
    financialData,
    includeKeyInsights,
    includeRecommendations,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateSummary = useCallback(async () => {
    if (status === "streaming" || !companyName.trim()) return;
    await handleSubmit();
  }, [status, companyName, handleSubmit]);

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
                companyName: "",
                reportType: "quarterly",
                financialData: "",
                includeKeyInsights: true,
                includeRecommendations: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Financial Report Summarizer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Financial Report Summarizer"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate financial report summaries
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
                      <Label htmlFor={companyNameId}>Company Name *</Label>
                      <Input
                        ref={companyNameRef}
                        id={companyNameId}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Company or Organization Name"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={reportTypeId}>Report Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quarterly">
                            Quarterly Report
                          </SelectItem>
                          <SelectItem value="annual">Annual Report</SelectItem>
                          <SelectItem value="monthly">
                            Monthly Report
                          </SelectItem>
                          <SelectItem value="earnings">
                            Earnings Report
                          </SelectItem>
                          <SelectItem value="financial-statement">
                            Financial Statement
                          </SelectItem>
                          <SelectItem value="budget">Budget Report</SelectItem>
                          <SelectItem value="forecast">
                            Financial Forecast
                          </SelectItem>
                          <SelectItem value="analysis">
                            Financial Analysis
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={financialDataId}>
                        Financial Data (Optional)
                      </Label>
                      <Textarea
                        id={financialDataId}
                        value={financialData}
                        onChange={(e) => setFinancialData(e.target.value)}
                        placeholder="Paste financial data, key metrics, or describe the financial information you want to analyze..."
                        rows={4}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Summary Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={keyInsightsId}
                            checked={includeKeyInsights}
                            onCheckedChange={(checked) =>
                              setIncludeKeyInsights(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={keyInsightsId}
                            className="text-sm font-normal"
                          >
                            Include key financial insights and analysis
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
                            Include strategic recommendations and action items
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!companyName.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Financial Report Summary"}
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
                        onClick={regenerateSummary}
                        disabled={
                          status === "streaming" ||
                          !companyName.trim() ||
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
                        Generated Financial Report Summary
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
                      <Response>{result}</Response>
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
                            ? "Analyzing financial data..."
                            : "Generating comprehensive financial report summary..."}
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
