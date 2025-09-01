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
import { Response } from "@/components/ai-elements/response";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function HabitTrackerDesigner() {
  const [habits, setHabits] = useState("");
  const [habitCategory, setHabitCategory] = useState("");
  const [trackingPeriod, setTrackingPeriod] = useState("");
  const [currentHabits, setCurrentHabits] = useState("");
  const [includeReminders, setIncludeReminders] = useState(true);
  const [includeRewards, setIncludeRewards] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const habitsRef = useRef<HTMLTextAreaElement>(null);
  const currentHabitsRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const trackingPeriodId = useId();
  const currentHabitsId = useId();
  const remindersId = useId();
  const rewardsId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.HABIT_TRACKER_DESIGNER
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setHabits(lastExecution.inputs.habits || "");
      setHabitCategory(lastExecution.inputs.habitCategory || "");
      setTrackingPeriod(lastExecution.inputs.trackingPeriod || "");
      setCurrentHabits(lastExecution.inputs.currentHabits || "");
      setIncludeReminders(lastExecution.inputs.includeReminders ?? true);
      setIncludeRewards(lastExecution.inputs.includeRewards ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (habitsRef.current) {
      habitsRef.current.style.height = "auto";
      habitsRef.current.style.height = `${habitsRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (currentHabitsRef.current) {
      currentHabitsRef.current.style.height = "auto";
      currentHabitsRef.current.style.height = `${currentHabitsRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!habits) return;

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

      const response = await fetch("/api/habit-tracker-designer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          habits,
          habitCategory,
          trackingPeriod,
          currentHabits,
          includeReminders,
          includeRewards,
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
          habits,
          habitCategory,
          trackingPeriod,
          currentHabits,
          includeReminders,
          includeRewards,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error designing habit tracker:", error);
        setResult("Error designing habit tracker. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    habits,
    habitCategory,
    trackingPeriod,
    currentHabits,
    includeReminders,
    includeRewards,
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
        <h1 className="text-3xl font-bold mb-2">Habit Tracker Designer</h1>
        <p className="text-muted-foreground">
          Create personalized habit tracking systems.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Design Habit Tracker
            </CardTitle>
            <CardDescription>
              Create a personalized system to track and build positive habits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Habits to Track</Label>
              <Textarea
                ref={habitsRef}
                id={inputId}
                value={habits}
                onChange={(e) => setHabits(e.target.value)}
                placeholder="List the habits you want to build or track..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Habit Category</Label>
              <Select value={habitCategory} onValueChange={setHabitCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select habit category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">Health & Fitness</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="learning">
                    Learning & Development
                  </SelectItem>
                  <SelectItem value="mindfulness">
                    Mindfulness & Wellness
                  </SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="creativity">
                    Creativity & Hobbies
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={trackingPeriodId}>Tracking Period</Label>
              <Input
                id={trackingPeriodId}
                value={trackingPeriod}
                onChange={(e) => setTrackingPeriod(e.target.value)}
                placeholder="e.g., 30 days, 3 months, 1 year"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={currentHabitsId}>Current Habits</Label>
              <Textarea
                ref={currentHabitsRef}
                id={currentHabitsId}
                value={currentHabits}
                onChange={(e) => setCurrentHabits(e.target.value)}
                placeholder="Describe your current habits and routines..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={remindersId}
                  checked={includeReminders}
                  onCheckedChange={(checked) =>
                    setIncludeReminders(checked as boolean)
                  }
                />
                <Label htmlFor={remindersId}>Include Reminder System</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={rewardsId}
                  checked={includeRewards}
                  onCheckedChange={(checked) =>
                    setIncludeRewards(checked as boolean)
                  }
                />
                <Label htmlFor={rewardsId}>Include Reward System</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !habits}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Designing Tracker...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Design Tracker
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Habit Tracker System</CardTitle>
            <CardDescription>
              Your personalized habit tracking system will appear here.
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
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Design Tracker" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
