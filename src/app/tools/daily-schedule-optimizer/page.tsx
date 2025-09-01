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
import { Clock, Loader2, Send, Copy, Check } from "lucide-react";
import { Response } from "@/components/ai-elements/response";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function DailyScheduleOptimizer() {
  const [currentSchedule, setCurrentSchedule] = useState("");
  const [scheduleType, setScheduleType] = useState("");
  const [workHours, setWorkHours] = useState("");
  const [priorities, setPriorities] = useState("");
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [includeBufferTime, setIncludeBufferTime] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentScheduleRef = useRef<HTMLTextAreaElement>(null);
  const prioritiesRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const workHoursId = useId();
  const prioritiesId = useId();
  const breaksId = useId();
  const bufferTimeId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.DAILY_SCHEDULE_OPTIMIZER
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setCurrentSchedule(lastExecution.inputs.currentSchedule || "");
      setScheduleType(lastExecution.inputs.scheduleType || "");
      setWorkHours(lastExecution.inputs.workHours || "");
      setPriorities(lastExecution.inputs.priorities || "");
      setIncludeBreaks(lastExecution.inputs.includeBreaks ?? true);
      setIncludeBufferTime(lastExecution.inputs.includeBufferTime ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (currentScheduleRef.current) {
      currentScheduleRef.current.style.height = "auto";
      currentScheduleRef.current.style.height = `${currentScheduleRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (prioritiesRef.current) {
      prioritiesRef.current.style.height = "auto";
      prioritiesRef.current.style.height = `${prioritiesRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!currentSchedule) return;

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

      const response = await fetch("/api/daily-schedule-optimizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          currentSchedule,
          scheduleType,
          workHours,
          priorities,
          includeBreaks,
          includeBufferTime,
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
          currentSchedule,
          scheduleType,
          workHours,
          priorities,
          includeBreaks,
          includeBufferTime,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error optimizing schedule:", error);
        setResult("Error optimizing schedule. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    currentSchedule,
    scheduleType,
    workHours,
    priorities,
    includeBreaks,
    includeBufferTime,
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
        <h1 className="text-3xl font-bold mb-2">Daily Schedule Optimizer</h1>
        <p className="text-muted-foreground">
          Optimize daily schedules for maximum productivity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Optimize Schedule
            </CardTitle>
            <CardDescription>
              Create an optimized daily schedule based on your priorities and
              constraints.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Current Schedule</Label>
              <Textarea
                ref={currentScheduleRef}
                id={inputId}
                value={currentSchedule}
                onChange={(e) => setCurrentSchedule(e.target.value)}
                placeholder="Describe your current daily schedule and activities..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Schedule Type</Label>
              <Select value={scheduleType} onValueChange={setScheduleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work Day</SelectItem>
                  <SelectItem value="personal">Personal Day</SelectItem>
                  <SelectItem value="hybrid">Hybrid Work</SelectItem>
                  <SelectItem value="student">Student Schedule</SelectItem>
                  <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={workHoursId}>Work Hours</Label>
              <Input
                id={workHoursId}
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                placeholder="e.g., 9 AM - 5 PM, 8 hours, Flexible"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={prioritiesId}>Priorities & Goals</Label>
              <Textarea
                ref={prioritiesRef}
                id={prioritiesId}
                value={priorities}
                onChange={(e) => setPriorities(e.target.value)}
                placeholder="List your top priorities, goals, and must-do tasks..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={breaksId}
                  checked={includeBreaks}
                  onCheckedChange={(checked) =>
                    setIncludeBreaks(checked as boolean)
                  }
                />
                <Label htmlFor={breaksId}>Include Breaks & Rest Periods</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={bufferTimeId}
                  checked={includeBufferTime}
                  onCheckedChange={(checked) =>
                    setIncludeBufferTime(checked as boolean)
                  }
                />
                <Label htmlFor={bufferTimeId}>Include Buffer Time</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !currentSchedule}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing Schedule...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Optimize Schedule
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimized Schedule</CardTitle>
            <CardDescription>
              Your optimized daily schedule will appear here.
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
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Optimize Schedule" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
