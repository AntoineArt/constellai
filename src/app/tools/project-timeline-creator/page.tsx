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
import { Calendar, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function ProjectTimelineCreator() {
  const [projectDescription, setProjectDescription] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [startDate, setStartDate] = useState("");
  const [includeMilestones, setIncludeMilestones] = useState(true);
  const [includeDependencies, setIncludeDependencies] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const projectDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const projectScopeRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const projectScopeId = useId();
  const teamSizeId = useId();
  const startDateId = useId();
  const milestonesId = useId();
  const dependenciesId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.PROJECT_TIMELINE_CREATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setProjectDescription(lastExecution.inputs.projectDescription || "");
      setProjectScope(lastExecution.inputs.projectScope || "");
      setTeamSize(lastExecution.inputs.teamSize || "");
      setStartDate(lastExecution.inputs.startDate || "");
      setIncludeMilestones(lastExecution.inputs.includeMilestones ?? true);
      setIncludeDependencies(lastExecution.inputs.includeDependencies ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (projectDescriptionRef.current) {
      projectDescriptionRef.current.style.height = "auto";
      projectDescriptionRef.current.style.height = `${projectDescriptionRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (projectScopeRef.current) {
      projectScopeRef.current.style.height = "auto";
      projectScopeRef.current.style.height = `${projectScopeRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!projectDescription) return;

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

      const response = await fetch("/api/project-timeline-creator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          projectDescription,
          projectScope,
          teamSize,
          startDate,
          includeMilestones,
          includeDependencies,
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
          projectDescription,
          projectScope,
          teamSize,
          startDate,
          includeMilestones,
          includeDependencies,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error creating project timeline:", error);
        setResult("Error creating project timeline. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    projectDescription,
    projectScope,
    teamSize,
    startDate,
    includeMilestones,
    includeDependencies,
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
        <h1 className="text-3xl font-bold mb-2">Project Timeline Creator</h1>
        <p className="text-muted-foreground">
          Generate Gantt chart descriptions and project timelines.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Create Project Timeline
            </CardTitle>
            <CardDescription>
              Design comprehensive project timelines with phases and milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Project Description</Label>
              <Textarea
                ref={projectDescriptionRef}
                id={inputId}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project, goals, and key deliverables..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={projectScopeId}>Project Scope</Label>
              <Textarea
                ref={projectScopeRef}
                id={projectScopeId}
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value)}
                placeholder="Define the scope, deliverables, and boundaries..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={teamSizeId}>Team Size</Label>
              <Input
                id={teamSizeId}
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="e.g., 5 people, 10 team members"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={startDateId}>Start Date</Label>
              <Input
                id={startDateId}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="e.g., January 15, 2024, Next Monday"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={milestonesId}
                  checked={includeMilestones}
                  onCheckedChange={(checked) =>
                    setIncludeMilestones(checked as boolean)
                  }
                />
                <Label htmlFor={milestonesId}>Include Key Milestones</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={dependenciesId}
                  checked={includeDependencies}
                  onCheckedChange={(checked) =>
                    setIncludeDependencies(checked as boolean)
                  }
                />
                <Label htmlFor={dependenciesId}>
                  Include Task Dependencies
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !projectDescription}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Timeline...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Timeline
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
            <CardDescription>
              Your comprehensive project timeline will appear here.
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
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Create Timeline" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
