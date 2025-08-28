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
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function LearningObjectiveWriter() {
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [learningLevel, setLearningLevel] = useState("");
  const [includeAssessment, setIncludeAssessment] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const topicRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const subjectId = useId();
  const assessmentId = useId();
  const activitiesId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.LEARNING_OBJECTIVE_WRITER
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setTopic(lastExecution.inputs.topic || "");
      setGradeLevel(lastExecution.inputs.gradeLevel || "");
      setSubject(lastExecution.inputs.subject || "");
      setLearningLevel(lastExecution.inputs.learningLevel || "");
      setIncludeAssessment(lastExecution.inputs.includeAssessment ?? true);
      setIncludeActivities(lastExecution.inputs.includeActivities ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (topicRef.current) {
      topicRef.current.style.height = "auto";
      topicRef.current.style.height = `${topicRef.current.scrollHeight}px`;
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

      const response = await fetch("/api/learning-objective-writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          topic,
          gradeLevel,
          subject,
          learningLevel,
          includeAssessment,
          includeActivities,
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
          subject,
          learningLevel,
          includeAssessment,
          includeActivities,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error writing learning objectives:", error);
        setResult("Error writing learning objectives. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    topic,
    gradeLevel,
    subject,
    learningLevel,
    includeAssessment,
    includeActivities,
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
        <h1 className="text-3xl font-bold mb-2">Learning Objective Writer</h1>
        <p className="text-muted-foreground">
          Generate clear, measurable learning objectives for courses.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Write Learning Objectives
            </CardTitle>
            <CardDescription>
              Create clear, measurable learning objectives for your courses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Learning Topic</Label>
              <Textarea
                ref={topicRef}
                id={inputId}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe the learning topic and what students should learn..."
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
                placeholder="e.g., Mathematics, Science, Language Arts"
              />
            </div>

            <div className="space-y-2">
              <Label>Learning Level</Label>
              <Select value={learningLevel} onValueChange={setLearningLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select learning level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={activitiesId}
                  checked={includeActivities}
                  onCheckedChange={(checked) =>
                    setIncludeActivities(checked as boolean)
                  }
                />
                <Label htmlFor={activitiesId}>
                  Include Learning Activities
                </Label>
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
                  Writing Learning Objectives...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Write Learning Objectives
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Objectives</CardTitle>
            <CardDescription>
              Your clear, measurable learning objectives will appear here.
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
                  Fill in the form and click "Write Learning Objectives" to get
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
