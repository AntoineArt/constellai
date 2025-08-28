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
import { Target, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function GoalSettingAssistant() {
  const [goalDescription, setGoalDescription] = useState("");
  const [goalCategory, setGoalCategory] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [currentSituation, setCurrentSituation] = useState("");
  const [includeActionPlan, setIncludeActionPlan] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const goalDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const currentSituationRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const timeframeId = useId();
  const currentSituationId = useId();
  const actionPlanId = useId();
  const metricsId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.GOAL_SETTING_ASSISTANT
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setGoalDescription(lastExecution.inputs.goalDescription || "");
      setGoalCategory(lastExecution.inputs.goalCategory || "");
      setTimeframe(lastExecution.inputs.timeframe || "");
      setCurrentSituation(lastExecution.inputs.currentSituation || "");
      setIncludeActionPlan(lastExecution.inputs.includeActionPlan ?? true);
      setIncludeMetrics(lastExecution.inputs.includeMetrics ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (goalDescriptionRef.current) {
      goalDescriptionRef.current.style.height = "auto";
      goalDescriptionRef.current.style.height = `${goalDescriptionRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (currentSituationRef.current) {
      currentSituationRef.current.style.height = "auto";
      currentSituationRef.current.style.height = `${currentSituationRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!goalDescription) return;

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

      const response = await fetch("/api/goal-setting-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          goalDescription,
          goalCategory,
          timeframe,
          currentSituation,
          includeActionPlan,
          includeMetrics,
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
          goalDescription,
          goalCategory,
          timeframe,
          currentSituation,
          includeActionPlan,
          includeMetrics,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error creating goal setting plan:", error);
        setResult("Error creating goal setting plan. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    goalDescription,
    goalCategory,
    timeframe,
    currentSituation,
    includeActionPlan,
    includeMetrics,
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
        <h1 className="text-3xl font-bold mb-2">Goal Setting Assistant</h1>
        <p className="text-muted-foreground">
          Create SMART goals with detailed action plans.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Create SMART Goals
            </CardTitle>
            <CardDescription>
              Transform your aspirations into actionable, measurable goals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Goal Description</Label>
              <Textarea
                ref={goalDescriptionRef}
                id={inputId}
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="Describe what you want to achieve..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Goal Category</Label>
              <Select value={goalCategory} onValueChange={setGoalCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal Development</SelectItem>
                  <SelectItem value="career">Career & Professional</SelectItem>
                  <SelectItem value="health">Health & Fitness</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                  <SelectItem value="learning">Learning & Education</SelectItem>
                  <SelectItem value="business">
                    Business & Entrepreneurship
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={timeframeId}>Timeframe</Label>
              <Input
                id={timeframeId}
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="e.g., 3 months, 6 months, 1 year"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={currentSituationId}>Current Situation</Label>
              <Textarea
                ref={currentSituationRef}
                id={currentSituationId}
                value={currentSituation}
                onChange={(e) => setCurrentSituation(e.target.value)}
                placeholder="Describe your current situation and starting point..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={actionPlanId}
                  checked={includeActionPlan}
                  onCheckedChange={(checked) =>
                    setIncludeActionPlan(checked as boolean)
                  }
                />
                <Label htmlFor={actionPlanId}>Include Action Plan</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={metricsId}
                  checked={includeMetrics}
                  onCheckedChange={(checked) =>
                    setIncludeMetrics(checked as boolean)
                  }
                />
                <Label htmlFor={metricsId}>Include Success Metrics</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !goalDescription}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Goals...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Goals
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMART Goals</CardTitle>
            <CardDescription>
              Your structured goals and action plan will appear here.
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
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fill in the form and click "Create Goals" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
