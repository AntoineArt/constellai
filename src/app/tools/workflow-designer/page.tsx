"use client";

import { useState, useCallback, useRef, useEffect, useId } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Workflow, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function WorkflowDesigner() {
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [workflowType, setWorkflowType] = useState("");
  const [stakeholders, setStakeholders] = useState("");
  const [currentWorkflow, setCurrentWorkflow] = useState("");
  const [includeDecisionPoints, setIncludeDecisionPoints] = useState(true);
  const [includeAutomation, setIncludeAutomation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const workflowDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const currentWorkflowRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const stakeholdersId = useId();
  const currentWorkflowId = useId();
  const decisionPointsId = useId();
  const automationId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.WORKFLOW_DESIGNER
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setWorkflowDescription(lastExecution.inputs.workflowDescription || "");
      setWorkflowType(lastExecution.inputs.workflowType || "");
      setStakeholders(lastExecution.inputs.stakeholders || "");
      setCurrentWorkflow(lastExecution.inputs.currentWorkflow || "");
      setIncludeDecisionPoints(
        lastExecution.inputs.includeDecisionPoints ?? true
      );
      setIncludeAutomation(lastExecution.inputs.includeAutomation ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (workflowDescriptionRef.current) {
      workflowDescriptionRef.current.style.height = "auto";
      workflowDescriptionRef.current.style.height = `${workflowDescriptionRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (currentWorkflowRef.current) {
      currentWorkflowRef.current.style.height = "auto";
      currentWorkflowRef.current.style.height = `${currentWorkflowRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!workflowDescription) return;

    setIsLoading(true);
    setResult("");
    setCopied(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        alert("Please set your API key in settings");
        return;
      }

      const response = await fetch("/api/workflow-designer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          workflowDescription,
          workflowType,
          stakeholders,
          currentWorkflow,
          includeDecisionPoints,
          includeAutomation,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let accumulatedResult = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedResult += chunk;
        setResult(accumulatedResult);
      }

      addToHistory({
        inputs: {
          workflowDescription,
          workflowType,
          stakeholders,
          currentWorkflow,
          includeDecisionPoints,
          includeAutomation,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error designing workflow:", error);
        setResult("Error designing workflow. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    workflowDescription,
    workflowType,
    stakeholders,
    currentWorkflow,
    includeDecisionPoints,
    includeAutomation,
    getApiKey,
    addToHistory,
  ]);

  const handleCopy = useCallback(async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workflow Designer</h1>
        <p className="text-muted-foreground">
          Create efficient workflow descriptions and diagrams.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Design Workflow
            </CardTitle>
            <CardDescription>
              Create efficient workflow descriptions and process diagrams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Workflow Description</Label>
              <Textarea
                ref={workflowDescriptionRef}
                id={inputId}
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe the workflow you want to design..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Workflow Type</Label>
              <Select value={workflowType} onValueChange={setWorkflowType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select workflow type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business-process">
                    Business Process
                  </SelectItem>
                  <SelectItem value="approval">Approval Workflow</SelectItem>
                  <SelectItem value="onboarding">
                    Onboarding Workflow
                  </SelectItem>
                  <SelectItem value="customer-service">
                    Customer Service Workflow
                  </SelectItem>
                  <SelectItem value="project-management">
                    Project Management Workflow
                  </SelectItem>
                  <SelectItem value="quality-assurance">
                    Quality Assurance Workflow
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={stakeholdersId}>Stakeholders/Roles</Label>
              <Input
                id={stakeholdersId}
                value={stakeholders}
                onChange={(e) => setStakeholders(e.target.value)}
                placeholder="e.g., Manager, Employee, Customer, Admin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={currentWorkflowId}>
                Current Workflow (Optional)
              </Label>
              <Textarea
                ref={currentWorkflowRef}
                id={currentWorkflowId}
                value={currentWorkflow}
                onChange={(e) => setCurrentWorkflow(e.target.value)}
                placeholder="Describe the current workflow if it exists..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={decisionPointsId}
                  checked={includeDecisionPoints}
                  onCheckedChange={(checked) =>
                    setIncludeDecisionPoints(checked as boolean)
                  }
                />
                <Label htmlFor={decisionPointsId}>
                  Include Decision Points
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={automationId}
                  checked={includeAutomation}
                  onCheckedChange={(checked) =>
                    setIncludeAutomation(checked as boolean)
                  }
                />
                <Label htmlFor={automationId}>
                  Include Automation Opportunities
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !workflowDescription}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Designing Workflow...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Design Workflow
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Design</CardTitle>
            <CardDescription>
              Your workflow description and diagram will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div
                  className={cn(
                    "prose prose-sm max-w-none",
                    "bg-muted/50 rounded-lg p-4",
                    "whitespace-pre-wrap"
                  )}
                >
                  {result}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Design Workflow" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
