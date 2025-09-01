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
import { Response } from "@/components/ai-elements/response";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function CurriculumDesigner() {
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [duration, setDuration] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [includeAssessments, setIncludeAssessments] = useState(true);
  const [includeResources, setIncludeResources] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const subjectRef = useRef<HTMLTextAreaElement>(null);
  const learningObjectivesRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const durationId = useId();
  const learningObjectivesId = useId();
  const assessmentsId = useId();
  const resourcesId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.CURRICULUM_DESIGNER
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setSubject(lastExecution.inputs.subject || "");
      setGradeLevel(lastExecution.inputs.gradeLevel || "");
      setDuration(lastExecution.inputs.duration || "");
      setLearningObjectives(lastExecution.inputs.learningObjectives || "");
      setIncludeAssessments(lastExecution.inputs.includeAssessments ?? true);
      setIncludeResources(lastExecution.inputs.includeResources ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (subjectRef.current) {
      subjectRef.current.style.height = "auto";
      subjectRef.current.style.height = `${subjectRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (learningObjectivesRef.current) {
      learningObjectivesRef.current.style.height = "auto";
      learningObjectivesRef.current.style.height = `${learningObjectivesRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!subject || !gradeLevel) return;

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

      const response = await fetch("/api/curriculum-designer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          subject,
          gradeLevel,
          duration,
          learningObjectives,
          includeAssessments,
          includeResources,
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
          subject,
          gradeLevel,
          duration,
          learningObjectives,
          includeAssessments,
          includeResources,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error designing curriculum:", error);
        setResult("Error designing curriculum. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    subject,
    gradeLevel,
    duration,
    learningObjectives,
    includeAssessments,
    includeResources,
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
        <h1 className="text-3xl font-bold mb-2">Curriculum Designer</h1>
        <p className="text-muted-foreground">
          Create educational curriculum outlines with learning objectives.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Design Curriculum
            </CardTitle>
            <CardDescription>
              Create comprehensive curriculum outlines for educational programs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Subject</Label>
              <Textarea
                ref={subjectRef}
                id={inputId}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Describe the subject area and main topics to be covered..."
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
                placeholder="List the main learning objectives for this curriculum..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={assessmentsId}
                  checked={includeAssessments}
                  onCheckedChange={(checked) =>
                    setIncludeAssessments(checked as boolean)
                  }
                />
                <Label htmlFor={assessmentsId}>
                  Include Assessment Strategy
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={resourcesId}
                  checked={includeResources}
                  onCheckedChange={(checked) =>
                    setIncludeResources(checked as boolean)
                  }
                />
                <Label htmlFor={resourcesId}>
                  Include Resources and Materials
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !subject || !gradeLevel}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Designing Curriculum...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Design Curriculum
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Curriculum Outline</CardTitle>
            <CardDescription>
              Your comprehensive curriculum will appear here.
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
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Design Curriculum" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
