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
import { CheckSquare, Loader2, Send, Copy, Check } from "lucide-react";
import { Response } from "@/components/ai-elements/response";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function TaskPrioritizer() {
  const [tasks, setTasks] = useState("");
  const [priorityMethod, setPriorityMethod] = useState("");
  const [context, setContext] = useState("");
  const [includeDeadlines, setIncludeDeadlines] = useState(true);
  const [includeEffort, setIncludeEffort] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const tasksRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const contextId = useId();
  const deadlinesId = useId();
  const effortId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.TASK_PRIORITIZER
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setTasks(lastExecution.inputs.tasks || "");
      setPriorityMethod(lastExecution.inputs.priorityMethod || "");
      setContext(lastExecution.inputs.context || "");
      setIncludeDeadlines(lastExecution.inputs.includeDeadlines ?? true);
      setIncludeEffort(lastExecution.inputs.includeEffort ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (tasksRef.current) {
      tasksRef.current.style.height = "auto";
      tasksRef.current.style.height = `${tasksRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!tasks) return;

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

      const response = await fetch("/api/task-prioritizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          tasks,
          priorityMethod,
          context,
          includeDeadlines,
          includeEffort,
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
          tasks,
          priorityMethod,
          context,
          includeDeadlines,
          includeEffort,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error prioritizing tasks:", error);
        setResult("Error prioritizing tasks. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    tasks,
    priorityMethod,
    context,
    includeDeadlines,
    includeEffort,
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
        <h1 className="text-3xl font-bold mb-2">Task Prioritizer</h1>
        <p className="text-muted-foreground">
          Organize and prioritize to-do lists with smart ranking.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Prioritize Tasks
            </CardTitle>
            <CardDescription>
              Organize your tasks with intelligent prioritization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Tasks</Label>
              <Textarea
                ref={tasksRef}
                id={inputId}
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                placeholder="List your tasks, one per line or separated by commas..."
                className="min-h-[150px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Priority Method</Label>
              <Select value={priorityMethod} onValueChange={setPriorityMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eisenhower-matrix">
                    Eisenhower Matrix
                  </SelectItem>
                  <SelectItem value="abc-method">ABC Method</SelectItem>
                  <SelectItem value="mo-scow">MoSCoW Method</SelectItem>
                  <SelectItem value="value-effort">Value vs Effort</SelectItem>
                  <SelectItem value="deadline-based">Deadline Based</SelectItem>
                  <SelectItem value="impact-effort">
                    Impact vs Effort
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={contextId}>Context/Goals</Label>
              <Input
                id={contextId}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., Work project, Personal goals, Team objectives"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={deadlinesId}
                  checked={includeDeadlines}
                  onCheckedChange={(checked) =>
                    setIncludeDeadlines(checked as boolean)
                  }
                />
                <Label htmlFor={deadlinesId}>Include Deadlines</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={effortId}
                  checked={includeEffort}
                  onCheckedChange={(checked) =>
                    setIncludeEffort(checked as boolean)
                  }
                />
                <Label htmlFor={effortId}>Include Effort Estimation</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !tasks}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Prioritizing Tasks...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Prioritize Tasks
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prioritized Tasks</CardTitle>
            <CardDescription>
              Your organized and prioritized task list will appear here.
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
                  <Response>{result}</Response>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Prioritize Tasks" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
