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

export default function DesignBriefGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.DESIGN_BRIEF_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const projectNameId = useId();
  const clientRequirementsId = useId();
  const targetAudienceId = useId();
  const designGoalsId = useId();
  const technicalSpecsId = useId();
  const timelineId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [projectName, setProjectName] = useState("");
  const [clientRequirements, setClientRequirements] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [designGoals, setDesignGoals] = useState("");
  const [includeTechnicalSpecs, setIncludeTechnicalSpecs] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const projectNameRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.projectName) {
        setProjectName(execution.inputs.projectName);
      }
      if (execution.inputs?.clientRequirements) {
        setClientRequirements(execution.inputs.clientRequirements);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.designGoals) {
        setDesignGoals(execution.inputs.designGoals);
      }
      if (execution.inputs?.includeTechnicalSpecs !== undefined) {
        setIncludeTechnicalSpecs(execution.inputs.includeTechnicalSpecs);
      }
      if (execution.inputs?.includeTimeline !== undefined) {
        setIncludeTimeline(execution.inputs.includeTimeline);
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
    if (hasApiKey && projectNameRef.current) {
      projectNameRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setProjectName("");
    setClientRequirements("");
    setTargetAudience("");
    setDesignGoals("");
    setIncludeTechnicalSpecs(true);
    setIncludeTimeline(true);
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
      !projectName.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/design-brief-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          projectName: projectName.trim(),
          clientRequirements: clientRequirements.trim(),
          targetAudience: targetAudience.trim(),
          designGoals: designGoals.trim(),
          includeTechnicalSpecs,
          includeTimeline,
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
            projectName: projectName.trim(),
            clientRequirements: clientRequirements.trim(),
            targetAudience: targetAudience.trim(),
            designGoals: designGoals.trim(),
            includeTechnicalSpecs,
            includeTimeline,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          projectName: projectName.trim(),
          clientRequirements: clientRequirements.trim(),
          targetAudience: targetAudience.trim(),
          designGoals: designGoals.trim(),
          includeTechnicalSpecs,
          includeTimeline,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating design brief.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    projectName,
    clientRequirements,
    targetAudience,
    designGoals,
    includeTechnicalSpecs,
    includeTimeline,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateBrief = useCallback(async () => {
    if (status === "streaming" || !projectName.trim()) return;
    await handleSubmit();
  }, [status, projectName, handleSubmit]);

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
                projectName: "",
                clientRequirements: "",
                targetAudience: "",
                designGoals: "",
                includeTechnicalSpecs: true,
                includeTimeline: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Design Brief Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Design Brief Generator"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate design briefs
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
                      <Label htmlFor={projectNameId}>Project Name *</Label>
                      <Input
                        ref={projectNameRef}
                        id={projectNameId}
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Your Project Name"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={clientRequirementsId}>
                        Client Requirements
                      </Label>
                      <Textarea
                        id={clientRequirementsId}
                        value={clientRequirements}
                        onChange={(e) => setClientRequirements(e.target.value)}
                        placeholder="Describe the client's requirements, goals, and any specific needs for this project..."
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={targetAudienceId}>Target Audience</Label>
                      <Input
                        id={targetAudienceId}
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="Who is the target audience for this project?"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={designGoalsId}>Design Goals</Label>
                      <Textarea
                        id={designGoalsId}
                        value={designGoals}
                        onChange={(e) => setDesignGoals(e.target.value)}
                        placeholder="What are the main design goals and objectives for this project?"
                        rows={3}
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Brief Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={technicalSpecsId}
                            checked={includeTechnicalSpecs}
                            onCheckedChange={(checked) =>
                              setIncludeTechnicalSpecs(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={technicalSpecsId}
                            className="text-sm font-normal"
                          >
                            Include technical specifications
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={timelineId}
                            checked={includeTimeline}
                            onCheckedChange={(checked) =>
                              setIncludeTimeline(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={timelineId}
                            className="text-sm font-normal"
                          >
                            Include timeline and milestones
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!projectName.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Design Brief"}
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
                        onClick={regenerateBrief}
                        disabled={
                          status === "streaming" ||
                          !projectName.trim() ||
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
                        Generated Design Brief
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
                            ? "Analyzing project requirements..."
                            : "Generating design brief..."}
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
