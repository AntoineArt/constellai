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

export default function SyllabusGenerator() {
  const [courseTitle, setCourseTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [duration, setDuration] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [includeSchedule, setIncludeSchedule] = useState(true);
  const [includePolicies, setIncludePolicies] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const courseTitleRef = useRef<HTMLTextAreaElement>(null);
  const learningObjectivesRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const subjectId = useId();
  const durationId = useId();
  const learningObjectivesId = useId();
  const scheduleId = useId();
  const policiesId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.SYLLABUS_GENERATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setCourseTitle(lastExecution.inputs.courseTitle || "");
      setSubject(lastExecution.inputs.subject || "");
      setGradeLevel(lastExecution.inputs.gradeLevel || "");
      setDuration(lastExecution.inputs.duration || "");
      setLearningObjectives(lastExecution.inputs.learningObjectives || "");
      setIncludeSchedule(lastExecution.inputs.includeSchedule ?? true);
      setIncludePolicies(lastExecution.inputs.includePolicies ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (courseTitleRef.current) {
      courseTitleRef.current.style.height = "auto";
      courseTitleRef.current.style.height = `${courseTitleRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (learningObjectivesRef.current) {
      learningObjectivesRef.current.style.height = "auto";
      learningObjectivesRef.current.style.height = `${learningObjectivesRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!courseTitle || !subject) return;

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

      const response = await fetch("/api/syllabus-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          courseTitle,
          subject,
          gradeLevel,
          duration,
          learningObjectives,
          includeSchedule,
          includePolicies,
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
          courseTitle,
          subject,
          gradeLevel,
          duration,
          learningObjectives,
          includeSchedule,
          includePolicies,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error generating syllabus:", error);
        setResult("Error generating syllabus. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    courseTitle,
    subject,
    gradeLevel,
    duration,
    learningObjectives,
    includeSchedule,
    includePolicies,
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
        <h1 className="text-3xl font-bold mb-2">Syllabus Generator</h1>
        <p className="text-muted-foreground">
          Generate course syllabi with schedules and requirements.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Generate Syllabus
            </CardTitle>
            <CardDescription>
              Create comprehensive course syllabi with clear structure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Course Title</Label>
              <Textarea
                ref={courseTitleRef}
                id={inputId}
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Enter the course title and brief description..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={subjectId}>Subject Area</Label>
              <Input
                id={subjectId}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Mathematics, English Literature, Computer Science"
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
              <Label htmlFor={durationId}>Course Duration</Label>
              <Input
                id={durationId}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 1 semester, 1 year, 12 weeks"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={learningObjectivesId}>Learning Objectives</Label>
              <Textarea
                ref={learningObjectivesRef}
                id={learningObjectivesId}
                value={learningObjectives}
                onChange={(e) => setLearningObjectives(e.target.value)}
                placeholder="List the main learning objectives for this course..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={scheduleId}
                  checked={includeSchedule}
                  onCheckedChange={(checked) =>
                    setIncludeSchedule(checked as boolean)
                  }
                />
                <Label htmlFor={scheduleId}>Include Course Schedule</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={policiesId}
                  checked={includePolicies}
                  onCheckedChange={(checked) =>
                    setIncludePolicies(checked as boolean)
                  }
                />
                <Label htmlFor={policiesId}>Include Course Policies</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !courseTitle || !subject}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Syllabus...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Syllabus
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Syllabus</CardTitle>
            <CardDescription>
              Your comprehensive course syllabus will appear here.
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
                  Fill in the form and click "Generate Syllabus" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
