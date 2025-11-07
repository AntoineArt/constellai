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

export default function GrantProposalWriterPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.GRANT_PROPOSAL_WRITER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const organizationId = useId();
  const projectTitleId = useId();
  const projectDescriptionId = useId();
  const fundingAmountId = useId();
  const targetAudienceId = useId();
  const timelineId = useId();
  const budgetId = useId();
  const evaluationId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [organization, setOrganization] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [fundingAmount, setFundingAmount] = useState("");
  const [grantType, setGrantType] = useState("general");
  const [targetAudience, setTargetAudience] = useState("");
  const [timeline, setTimeline] = useState("");
  const [includeBudget, setIncludeBudget] = useState(true);
  const [includeEvaluation, setIncludeEvaluation] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const organizationRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.organization) {
        setOrganization(execution.inputs.organization);
      }
      if (execution.inputs?.projectTitle) {
        setProjectTitle(execution.inputs.projectTitle);
      }
      if (execution.inputs?.projectDescription) {
        setProjectDescription(execution.inputs.projectDescription);
      }
      if (execution.inputs?.fundingAmount) {
        setFundingAmount(execution.inputs.fundingAmount);
      }
      if (execution.inputs?.grantType) {
        setGrantType(execution.inputs.grantType);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.timeline) {
        setTimeline(execution.inputs.timeline);
      }
      if (execution.inputs?.includeBudget !== undefined) {
        setIncludeBudget(execution.inputs.includeBudget);
      }
      if (execution.inputs?.includeEvaluation !== undefined) {
        setIncludeEvaluation(execution.inputs.includeEvaluation);
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
    if (hasApiKey && organizationRef.current) {
      organizationRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setOrganization("");
    setProjectTitle("");
    setProjectDescription("");
    setFundingAmount("");
    setGrantType("general");
    setTargetAudience("");
    setTimeline("");
    setIncludeBudget(true);
    setIncludeEvaluation(true);
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
      !organization.trim() ||
      !projectTitle.trim() ||
      !projectDescription.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/grant-proposal-writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          organization: organization.trim(),
          projectTitle: projectTitle.trim(),
          projectDescription: projectDescription.trim(),
          fundingAmount: fundingAmount.trim(),
          grantType,
          targetAudience: targetAudience.trim(),
          timeline: timeline.trim(),
          includeBudget,
          includeEvaluation,
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
            organization: organization.trim(),
            projectTitle: projectTitle.trim(),
            projectDescription: projectDescription.trim(),
            fundingAmount: fundingAmount.trim(),
            grantType,
            targetAudience: targetAudience.trim(),
            timeline: timeline.trim(),
            includeBudget,
            includeEvaluation,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          organization: organization.trim(),
          projectTitle: projectTitle.trim(),
          projectDescription: projectDescription.trim(),
          fundingAmount: fundingAmount.trim(),
          grantType,
          targetAudience: targetAudience.trim(),
          timeline: timeline.trim(),
          includeBudget,
          includeEvaluation,
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
          "Sorry, an error occurred while generating the grant proposal."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    organization,
    projectTitle,
    projectDescription,
    fundingAmount,
    grantType,
    targetAudience,
    timeline,
    includeBudget,
    includeEvaluation,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateProposal = useCallback(async () => {
    if (
      status === "streaming" ||
      !organization.trim() ||
      !projectTitle.trim() ||
      !projectDescription.trim()
    )
      return;
    await handleSubmit();
  }, [status, organization, projectTitle, projectDescription, handleSubmit]);

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
                organization: "",
                projectTitle: "",
                projectDescription: "",
                fundingAmount: "",
                grantType: "general",
                targetAudience: "",
                timeline: "",
                includeBudget: true,
                includeEvaluation: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Grant Proposal Writer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Grant Proposal Writer"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate grant proposals
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={organizationId}>
                          Organization Name *
                        </Label>
                        <Input
                          ref={organizationRef}
                          id={organizationId}
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="Your Organization"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={projectTitleId}>Project Title *</Label>
                        <Input
                          id={projectTitleId}
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          placeholder="Project Name"
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={projectDescriptionId}>
                        Project Description *
                      </Label>
                      <Textarea
                        id={projectDescriptionId}
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Describe your project, its goals, and expected outcomes..."
                        className="min-h-[100px] max-h-[200px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={fundingAmountId}>Funding Amount</Label>
                        <Input
                          id={fundingAmountId}
                          value={fundingAmount}
                          onChange={(e) => setFundingAmount(e.target.value)}
                          placeholder="$50,000"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Grant Type</Label>
                        <Select value={grantType} onValueChange={setGrantType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">
                              General Grant
                            </SelectItem>
                            <SelectItem value="research">
                              Research Grant
                            </SelectItem>
                            <SelectItem value="community">
                              Community Grant
                            </SelectItem>
                            <SelectItem value="education">
                              Education Grant
                            </SelectItem>
                            <SelectItem value="healthcare">
                              Healthcare Grant
                            </SelectItem>
                            <SelectItem value="environmental">
                              Environmental Grant
                            </SelectItem>
                            <SelectItem value="arts">
                              Arts & Culture Grant
                            </SelectItem>
                            <SelectItem value="technology">
                              Technology Grant
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={targetAudienceId}>
                          Target Audience
                        </Label>
                        <Input
                          id={targetAudienceId}
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="Who will benefit from this project?"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={timelineId}>Project Timeline</Label>
                        <Input
                          id={timelineId}
                          value={timeline}
                          onChange={(e) => setTimeline(e.target.value)}
                          placeholder="12 months, 6 months, etc."
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Proposal Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={budgetId}
                            checked={includeBudget}
                            onCheckedChange={(checked) =>
                              setIncludeBudget(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={budgetId}
                            className="text-sm font-normal"
                          >
                            Include detailed budget breakdown
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={evaluationId}
                            checked={includeEvaluation}
                            onCheckedChange={(checked) =>
                              setIncludeEvaluation(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={evaluationId}
                            className="text-sm font-normal"
                          >
                            Include evaluation and impact measurement plan
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          !organization.trim() ||
                          !projectTitle.trim() ||
                          !projectDescription.trim() ||
                          status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Grant Proposal"}
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
                        onClick={regenerateProposal}
                        disabled={
                          status === "streaming" ||
                          !organization.trim() ||
                          !projectTitle.trim() ||
                          !projectDescription.trim() ||
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
                        Generated Grant Proposal
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
                            ? "Analyzing project requirements..."
                            : "Generating comprehensive grant proposal..."}
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
