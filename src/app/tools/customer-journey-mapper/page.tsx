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

export default function CustomerJourneyMapperPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.CUSTOMER_JOURNEY_MAPPER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const businessTypeId = useId();
  const customerSegmentsId = useId();
  const currentJourneyId = useId();
  const detailedMappingId = useId();
  const optimizationRecommendationsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [businessType, setBusinessType] = useState("general");
  const [customerSegments, setCustomerSegments] = useState("");
  const [currentJourney, setCurrentJourney] = useState("");
  const [includeDetailedMapping, setIncludeDetailedMapping] = useState(true);
  const [
    includeOptimizationRecommendations,
    setIncludeOptimizationRecommendations,
  ] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const businessTypeRef = useRef<HTMLButtonElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.businessType) {
        setBusinessType(execution.inputs.businessType);
      }
      if (execution.inputs?.customerSegments) {
        setCustomerSegments(execution.inputs.customerSegments);
      }
      if (execution.inputs?.currentJourney) {
        setCurrentJourney(execution.inputs.currentJourney);
      }
      if (execution.inputs?.includeDetailedMapping !== undefined) {
        setIncludeDetailedMapping(execution.inputs.includeDetailedMapping);
      }
      if (execution.inputs?.includeOptimizationRecommendations !== undefined) {
        setIncludeOptimizationRecommendations(
          execution.inputs.includeOptimizationRecommendations
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
    setCustomerSegments("");
    setCurrentJourney("");
    setIncludeDetailedMapping(true);
    setIncludeOptimizationRecommendations(true);
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

      const response = await fetch("/api/customer-journey-mapper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          businessType,
          customerSegments: customerSegments.trim(),
          currentJourney: currentJourney.trim(),
          includeDetailedMapping,
          includeOptimizationRecommendations,
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
            customerSegments: customerSegments.trim(),
            currentJourney: currentJourney.trim(),
            includeDetailedMapping,
            includeOptimizationRecommendations,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          businessType,
          customerSegments: customerSegments.trim(),
          currentJourney: currentJourney.trim(),
          includeDetailedMapping,
          includeOptimizationRecommendations,
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
          "Sorry, an error occurred while generating customer journey map."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    businessType,
    customerSegments,
    currentJourney,
    includeDetailedMapping,
    includeOptimizationRecommendations,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateMap = useCallback(async () => {
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
                customerSegments: "",
                currentJourney: "",
                includeDetailedMapping: true,
                includeOptimizationRecommendations: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Customer Journey Mapper"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Customer Journey Mapper"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate customer journey maps
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
                          <SelectItem value="service">
                            Service Business
                          </SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">
                            Finance/Banking
                          </SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="startup">Startup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={customerSegmentsId}>
                        Customer Segments
                      </Label>
                      <Textarea
                        id={customerSegmentsId}
                        value={customerSegments}
                        onChange={(e) => setCustomerSegments(e.target.value)}
                        placeholder="Describe your customer segments, personas, demographics, and characteristics..."
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={currentJourneyId}>
                        Current Customer Journey (Optional)
                      </Label>
                      <Textarea
                        id={currentJourneyId}
                        value={currentJourney}
                        onChange={(e) => setCurrentJourney(e.target.value)}
                        placeholder="Describe your current customer journey, touchpoints, and any specific areas you want to focus on..."
                        rows={4}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Mapping Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={detailedMappingId}
                            checked={includeDetailedMapping}
                            onCheckedChange={(checked) =>
                              setIncludeDetailedMapping(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={detailedMappingId}
                            className="text-sm font-normal"
                          >
                            Include detailed touchpoint mapping and analysis
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={optimizationRecommendationsId}
                            checked={includeOptimizationRecommendations}
                            onCheckedChange={(checked) =>
                              setIncludeOptimizationRecommendations(
                                checked as boolean
                              )
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={optimizationRecommendationsId}
                            className="text-sm font-normal"
                          >
                            Include optimization recommendations and improvement
                            strategies
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={status === "streaming"}>
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Customer Journey Map"}
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
                        onClick={regenerateMap}
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
                        Generated Customer Journey Map
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
                            ? "Analyzing customer journey requirements..."
                            : "Generating comprehensive customer journey map..."}
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
