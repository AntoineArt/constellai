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

export default function RiskAssessmentToolPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.RISK_ASSESSMENT_TOOL, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const businessTypeId = useId();
  const industryId = useId();
  const currentSituationId = useId();
  const detailedAnalysisId = useId();
  const mitigationStrategiesId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [businessType, setBusinessType] = useState("general");
  const [industry, setIndustry] = useState("");
  const [currentSituation, setCurrentSituation] = useState("");
  const [includeDetailedAnalysis, setIncludeDetailedAnalysis] = useState(true);
  const [includeMitigationStrategies, setIncludeMitigationStrategies] =
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
      if (execution.inputs?.industry) {
        setIndustry(execution.inputs.industry);
      }
      if (execution.inputs?.currentSituation) {
        setCurrentSituation(execution.inputs.currentSituation);
      }
      if (execution.inputs?.includeDetailedAnalysis !== undefined) {
        setIncludeDetailedAnalysis(execution.inputs.includeDetailedAnalysis);
      }
      if (execution.inputs?.includeMitigationStrategies !== undefined) {
        setIncludeMitigationStrategies(
          execution.inputs.includeMitigationStrategies
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
    setIndustry("");
    setCurrentSituation("");
    setIncludeDetailedAnalysis(true);
    setIncludeMitigationStrategies(true);
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

      const response = await fetch("/api/risk-assessment-tool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          businessType,
          industry: industry.trim(),
          currentSituation: currentSituation.trim(),
          includeDetailedAnalysis,
          includeMitigationStrategies,
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
            industry: industry.trim(),
            currentSituation: currentSituation.trim(),
            includeDetailedAnalysis,
            includeMitigationStrategies,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          businessType,
          industry: industry.trim(),
          currentSituation: currentSituation.trim(),
          includeDetailedAnalysis,
          includeMitigationStrategies,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating risk assessment.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    businessType,
    industry,
    currentSituation,
    includeDetailedAnalysis,
    includeMitigationStrategies,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateAssessment = useCallback(async () => {
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
                industry: "",
                currentSituation: "",
                includeDetailedAnalysis: true,
                includeMitigationStrategies: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Risk Assessment Tool"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Risk Assessment Tool"
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
                    generate risk assessments
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
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="sme">
                            Small/Medium Enterprise
                          </SelectItem>
                          <SelectItem value="enterprise">
                            Large Enterprise
                          </SelectItem>
                          <SelectItem value="nonprofit">
                            Non-Profit Organization
                          </SelectItem>
                          <SelectItem value="government">
                            Government Agency
                          </SelectItem>
                          <SelectItem value="consulting">
                            Consulting Firm
                          </SelectItem>
                          <SelectItem value="manufacturing">
                            Manufacturing
                          </SelectItem>
                          <SelectItem value="retail">
                            Retail Business
                          </SelectItem>
                          <SelectItem value="technology">
                            Technology Company
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={industryId}>Industry</Label>
                      <Input
                        id={industryId}
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g., Technology, Healthcare, Finance, Manufacturing, Retail..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={currentSituationId}>
                        Current Business Situation
                      </Label>
                      <Textarea
                        id={currentSituationId}
                        value={currentSituation}
                        onChange={(e) => setCurrentSituation(e.target.value)}
                        placeholder="Describe your current business situation, challenges, market conditions, or specific concerns you want to assess..."
                        rows={4}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Assessment Options</Label>
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
                            Include detailed probability and impact analysis
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={mitigationStrategiesId}
                            checked={includeMitigationStrategies}
                            onCheckedChange={(checked) =>
                              setIncludeMitigationStrategies(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={mitigationStrategiesId}
                            className="text-sm font-normal"
                          >
                            Include detailed mitigation strategies and action
                            plans
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={status === "streaming"}>
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Risk Assessment"}
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
                        onClick={regenerateAssessment}
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
                        Generated Risk Assessment
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
                            ? "Analyzing business risks..."
                            : "Generating comprehensive risk assessment..."}
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
