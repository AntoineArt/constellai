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
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function ResearchProposalWriter() {
  const [researchTopic, setResearchTopic] = useState("");
  const [objectives, setObjectives] = useState("");
  const [methodology, setMethodology] = useState("");
  const [timeline, setTimeline] = useState("");
  const [includeDetailedMethodology, setIncludeDetailedMethodology] =
    useState(true);
  const [includeBudget, setIncludeBudget] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const researchTopicRef = useRef<HTMLTextAreaElement>(null);
  const objectivesRef = useRef<HTMLTextAreaElement>(null);
  const methodologyRef = useRef<HTMLTextAreaElement>(null);
  const timelineRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const objectivesId = useId();
  const methodologyId = useId();
  const timelineId = useId();
  const detailedMethodologyId = useId();
  const budgetId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.RESEARCH_PROPOSAL_WRITER
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setResearchTopic(lastExecution.inputs.researchTopic || "");
      setObjectives(lastExecution.inputs.objectives || "");
      setMethodology(lastExecution.inputs.methodology || "");
      setTimeline(lastExecution.inputs.timeline || "");
      setIncludeDetailedMethodology(
        lastExecution.inputs.includeDetailedMethodology ?? true
      );
      setIncludeBudget(lastExecution.inputs.includeBudget ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (researchTopicRef.current) {
      researchTopicRef.current.style.height = "auto";
      researchTopicRef.current.style.height = `${researchTopicRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (objectivesRef.current) {
      objectivesRef.current.style.height = "auto";
      objectivesRef.current.style.height = `${objectivesRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (methodologyRef.current) {
      methodologyRef.current.style.height = "auto";
      methodologyRef.current.style.height = `${methodologyRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.style.height = "auto";
      timelineRef.current.style.height = `${timelineRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!researchTopic || !objectives) return;

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

      const response = await fetch("/api/research-proposal-writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          researchTopic,
          objectives,
          methodology,
          timeline,
          includeDetailedMethodology,
          includeBudget,
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
          researchTopic,
          objectives,
          methodology,
          timeline,
          includeDetailedMethodology,
          includeBudget,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error writing research proposal:", error);
        setResult("Error writing research proposal. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    researchTopic,
    objectives,
    methodology,
    timeline,
    includeDetailedMethodology,
    includeBudget,
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
        <h1 className="text-3xl font-bold mb-2">Research Proposal Writer</h1>
        <p className="text-muted-foreground">
          Create structured research proposals with methodology and objectives.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Write Research Proposal
            </CardTitle>
            <CardDescription>
              Generate comprehensive research proposals with detailed
              methodology.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Research Topic</Label>
              <Textarea
                ref={researchTopicRef}
                id={inputId}
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                placeholder="Describe your research topic and main research question..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={objectivesId}>Research Objectives</Label>
              <Textarea
                ref={objectivesRef}
                id={objectivesId}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="List your specific research objectives and goals..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={methodologyId}>Research Methodology</Label>
              <Textarea
                ref={methodologyRef}
                id={methodologyId}
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                placeholder="Describe your research approach, methods, and data collection strategies..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={timelineId}>Project Timeline</Label>
              <Textarea
                ref={timelineRef}
                id={timelineId}
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="Outline your research timeline and key milestones..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={detailedMethodologyId}
                  checked={includeDetailedMethodology}
                  onCheckedChange={(checked) =>
                    setIncludeDetailedMethodology(checked as boolean)
                  }
                />
                <Label htmlFor={detailedMethodologyId}>
                  Include Detailed Methodology
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={budgetId}
                  checked={includeBudget}
                  onCheckedChange={(checked) =>
                    setIncludeBudget(checked as boolean)
                  }
                />
                <Label htmlFor={budgetId}>Include Budget Breakdown</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !researchTopic || !objectives}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Writing Proposal...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Write Proposal
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Research Proposal</CardTitle>
            <CardDescription>
              Your comprehensive research proposal will appear here.
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
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Write Proposal" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
