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

export default function SurveyDesignerPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.SURVEY_DESIGNER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const surveyPurposeId = useId();
  const targetAudienceId = useId();
  const researchObjectivesId = useId();
  const comprehensiveQuestionsId = useId();
  const analysisFrameworkId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [surveyPurpose, setSurveyPurpose] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [researchObjectives, setResearchObjectives] = useState("");
  const [includeComprehensiveQuestions, setIncludeComprehensiveQuestions] =
    useState(true);
  const [includeAnalysisFramework, setIncludeAnalysisFramework] =
    useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const surveyPurposeRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.surveyPurpose) {
        setSurveyPurpose(execution.inputs.surveyPurpose);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.researchObjectives) {
        setResearchObjectives(execution.inputs.researchObjectives);
      }
      if (execution.inputs?.includeComprehensiveQuestions !== undefined) {
        setIncludeComprehensiveQuestions(
          execution.inputs.includeComprehensiveQuestions
        );
      }
      if (execution.inputs?.includeAnalysisFramework !== undefined) {
        setIncludeAnalysisFramework(execution.inputs.includeAnalysisFramework);
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
    if (hasApiKey && surveyPurposeRef.current) {
      surveyPurposeRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setSurveyPurpose("");
    setTargetAudience("");
    setResearchObjectives("");
    setIncludeComprehensiveQuestions(true);
    setIncludeAnalysisFramework(true);
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
      !surveyPurpose.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/survey-designer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          surveyPurpose: surveyPurpose.trim(),
          targetAudience: targetAudience.trim(),
          researchObjectives: researchObjectives.trim(),
          includeComprehensiveQuestions,
          includeAnalysisFramework,
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
            surveyPurpose: surveyPurpose.trim(),
            targetAudience: targetAudience.trim(),
            researchObjectives: researchObjectives.trim(),
            includeComprehensiveQuestions,
            includeAnalysisFramework,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          surveyPurpose: surveyPurpose.trim(),
          targetAudience: targetAudience.trim(),
          researchObjectives: researchObjectives.trim(),
          includeComprehensiveQuestions,
          includeAnalysisFramework,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating survey design.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    surveyPurpose,
    targetAudience,
    researchObjectives,
    includeComprehensiveQuestions,
    includeAnalysisFramework,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateSurvey = useCallback(async () => {
    if (status === "streaming" || !surveyPurpose.trim()) return;
    await handleSubmit();
  }, [status, surveyPurpose, handleSubmit]);

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
                surveyPurpose: "",
                targetAudience: "",
                researchObjectives: "",
                includeComprehensiveQuestions: true,
                includeAnalysisFramework: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Survey Designer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Survey Designer"
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
                    generate survey designs
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
                      <Label htmlFor={surveyPurposeId}>Survey Purpose *</Label>
                      <Input
                        ref={surveyPurposeRef}
                        id={surveyPurposeId}
                        value={surveyPurpose}
                        onChange={(e) => setSurveyPurpose(e.target.value)}
                        placeholder="e.g., Customer satisfaction survey, Employee engagement research, Market research..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={targetAudienceId}>Target Audience</Label>
                      <Textarea
                        id={targetAudienceId}
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="Describe your target audience, demographics, characteristics, and sample size..."
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={researchObjectivesId}>
                        Research Objectives
                      </Label>
                      <Textarea
                        id={researchObjectivesId}
                        value={researchObjectives}
                        onChange={(e) => setResearchObjectives(e.target.value)}
                        placeholder="What specific research questions or objectives do you want to address?"
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Design Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={comprehensiveQuestionsId}
                            checked={includeComprehensiveQuestions}
                            onCheckedChange={(checked) =>
                              setIncludeComprehensiveQuestions(
                                checked as boolean
                              )
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={comprehensiveQuestionsId}
                            className="text-sm font-normal"
                          >
                            Include comprehensive question examples and formats
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={analysisFrameworkId}
                            checked={includeAnalysisFramework}
                            onCheckedChange={(checked) =>
                              setIncludeAnalysisFramework(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={analysisFrameworkId}
                            className="text-sm font-normal"
                          >
                            Include data analysis framework and methodology
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          !surveyPurpose.trim() || status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Survey Design"}
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
                        onClick={regenerateSurvey}
                        disabled={
                          status === "streaming" ||
                          !surveyPurpose.trim() ||
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
                        Generated Survey Design
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
                            ? "Analyzing survey requirements..."
                            : "Generating comprehensive survey design..."}
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
