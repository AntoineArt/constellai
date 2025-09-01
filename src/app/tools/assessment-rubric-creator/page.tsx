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
import { FileText, Loader2, Send, Copy, Check } from "lucide-react";
import { Response } from "@/components/ai-elements/response";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function AssessmentRubricCreator() {
  const [assignment, setAssignment] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [rubricType, setRubricType] = useState("");
  const [includeCriteria, setIncludeCriteria] = useState(true);
  const [includeScoring, setIncludeScoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const assignmentRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const subjectId = useId();
  const criteriaId = useId();
  const scoringId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.ASSESSMENT_RUBRIC_CREATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setAssignment(lastExecution.inputs.assignment || "");
      setGradeLevel(lastExecution.inputs.gradeLevel || "");
      setSubject(lastExecution.inputs.subject || "");
      setRubricType(lastExecution.inputs.rubricType || "");
      setIncludeCriteria(lastExecution.inputs.includeCriteria ?? true);
      setIncludeScoring(lastExecution.inputs.includeScoring ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (assignmentRef.current) {
      assignmentRef.current.style.height = "auto";
      assignmentRef.current.style.height = `${assignmentRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!assignment || !gradeLevel) return;

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

      const response = await fetch("/api/assessment-rubric-creator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          assignment,
          gradeLevel,
          subject,
          rubricType,
          includeCriteria,
          includeScoring,
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
          assignment,
          gradeLevel,
          subject,
          rubricType,
          includeCriteria,
          includeScoring,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error creating assessment rubric:", error);
        setResult("Error creating assessment rubric. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    assignment,
    gradeLevel,
    subject,
    rubricType,
    includeCriteria,
    includeScoring,
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
        <h1 className="text-3xl font-bold mb-2">Assessment Rubric Creator</h1>
        <p className="text-muted-foreground">
          Create grading rubrics for assignments and assessments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Assessment Rubric
            </CardTitle>
            <CardDescription>
              Generate comprehensive grading rubrics for fair assessment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Assignment Description</Label>
              <Textarea
                ref={assignmentRef}
                id={inputId}
                value={assignment}
                onChange={(e) => setAssignment(e.target.value)}
                placeholder="Describe the assignment, project, or assessment to be graded..."
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
              <Label htmlFor={subjectId}>Subject Area</Label>
              <Input
                id={subjectId}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., English, Science, Mathematics"
              />
            </div>

            <div className="space-y-2">
              <Label>Rubric Type</Label>
              <Select value={rubricType} onValueChange={setRubricType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rubric type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analytic">Analytic Rubric</SelectItem>
                  <SelectItem value="holistic">Holistic Rubric</SelectItem>
                  <SelectItem value="single-point">
                    Single-Point Rubric
                  </SelectItem>
                  <SelectItem value="checklist">Checklist Rubric</SelectItem>
                  <SelectItem value="rating-scale">Rating Scale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={criteriaId}
                  checked={includeCriteria}
                  onCheckedChange={(checked) =>
                    setIncludeCriteria(checked as boolean)
                  }
                />
                <Label htmlFor={criteriaId}>Include Detailed Criteria</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={scoringId}
                  checked={includeScoring}
                  onCheckedChange={(checked) =>
                    setIncludeScoring(checked as boolean)
                  }
                />
                <Label htmlFor={scoringId}>Include Scoring Guide</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !assignment || !gradeLevel}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Rubric...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Rubric
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Rubric</CardTitle>
            <CardDescription>
              Your comprehensive grading rubric will appear here.
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
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Create Rubric" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
