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
import { BookOpen, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function LessonPlanCreator() {
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [duration, setDuration] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeAssessment, setIncludeAssessment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const topicRef = useRef<HTMLTextAreaElement>(null);
  const learningObjectivesRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const durationId = useId();
  const learningObjectivesId = useId();
  const activitiesId = useId();
  const assessmentId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.LESSON_PLAN_CREATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setTopic(lastExecution.inputs.topic || "");
      setGradeLevel(lastExecution.inputs.gradeLevel || "");
      setDuration(lastExecution.inputs.duration || "");
      setLearningObjectives(lastExecution.inputs.learningObjectives || "");
      setIncludeActivities(lastExecution.inputs.includeActivities ?? true);
      setIncludeAssessment(lastExecution.inputs.includeAssessment ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (topicRef.current) {
      topicRef.current.style.height = "auto";
      topicRef.current.style.height = `${topicRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (learningObjectivesRef.current) {
      learningObjectivesRef.current.style.height = "auto";
      learningObjectivesRef.current.style.height = `${learningObjectivesRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!topic || !gradeLevel) return;

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

      const response = await fetch("/api/lesson-plan-creator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          topic,
          gradeLevel,
          duration,
          learningObjectives,
          includeActivities,
          includeAssessment,
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
          topic,
          gradeLevel,
          duration,
          learningObjectives,
          includeActivities,
          includeAssessment,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error creating lesson plan:", error);
        setResult("Error creating lesson plan. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    topic,
    gradeLevel,
    duration,
    learningObjectives,
    includeActivities,
    includeAssessment,
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
        <h1 className="text-3xl font-bold mb-2">Lesson Plan Creator</h1>
        <p className="text-muted-foreground">
          Generate structured lesson plans with objectives and activities.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Create Lesson Plan
            </CardTitle>
            <CardDescription>
              Generate comprehensive lesson plans with clear structure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Lesson Topic</Label>
              <Textarea
                ref={topicRef}
                id={inputId}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe the lesson topic and main concepts..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elementary">Elementary (K-5)</SelectItem>
                  <SelectItem value="middle-school">
                    Middle School (6-8)
                  </SelectItem>
                  <SelectItem value="high-school">
                    High School (9-12)
                  </SelectItem>
                  <SelectItem value="college">College/University</SelectItem>
                  <SelectItem value="adult-education">
                    Adult Education
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={durationId}>Lesson Duration</Label>
              <Input
                id={durationId}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 45 minutes, 1 hour, 90 minutes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={learningObjectivesId}>Learning Objectives</Label>
              <Textarea
                ref={learningObjectivesRef}
                id={learningObjectivesId}
                value={learningObjectives}
                onChange={(e) => setLearningObjectives(e.target.value)}
                placeholder="List the learning objectives for this lesson..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={activitiesId}
                  checked={includeActivities}
                  onCheckedChange={(checked) =>
                    setIncludeActivities(checked as boolean)
                  }
                />
                <Label htmlFor={activitiesId}>
                  Include Detailed Activities
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={assessmentId}
                  checked={includeAssessment}
                  onCheckedChange={(checked) =>
                    setIncludeAssessment(checked as boolean)
                  }
                />
                <Label htmlFor={assessmentId}>Include Assessment Methods</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !topic || !gradeLevel}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Lesson Plan...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Lesson Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lesson Plan</CardTitle>
            <CardDescription>
              Your structured lesson plan will appear here.
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
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Create Lesson Plan" to get
                  started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
