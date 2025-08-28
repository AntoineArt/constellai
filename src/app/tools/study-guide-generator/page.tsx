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
import { GraduationCap, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function StudyGuideGenerator() {
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [includePracticeQuestions, setIncludePracticeQuestions] =
    useState(true);
  const [includeSummary, setIncludeSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const subjectId = useId();
  const practiceQuestionsId = useId();
  const summaryId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.STUDY_GUIDE_GENERATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setNotes(lastExecution.inputs.notes || "");
      setSubject(lastExecution.inputs.subject || "");
      setStudyLevel(lastExecution.inputs.studyLevel || "");
      setIncludePracticeQuestions(
        lastExecution.inputs.includePracticeQuestions ?? true
      );
      setIncludeSummary(lastExecution.inputs.includeSummary ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.style.height = "auto";
      notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!notes || !subject) return;

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

      const response = await fetch("/api/study-guide-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          notes,
          subject,
          studyLevel,
          includePracticeQuestions,
          includeSummary,
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
          notes,
          subject,
          studyLevel,
          includePracticeQuestions,
          includeSummary,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error generating study guide:", error);
        setResult("Error generating study guide. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    notes,
    subject,
    studyLevel,
    includePracticeQuestions,
    includeSummary,
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
        <h1 className="text-3xl font-bold mb-2">Study Guide Generator</h1>
        <p className="text-muted-foreground">
          Convert notes into comprehensive study guides with key concepts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Generate Study Guide
            </CardTitle>
            <CardDescription>
              Transform your notes into organized study materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Notes</Label>
              <Textarea
                ref={notesRef}
                id={inputId}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your study notes, lecture notes, or content to organize..."
                className="min-h-[150px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={subjectId}>Subject</Label>
              <Input
                id={subjectId}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Biology, Calculus, World History"
              />
            </div>

            <div className="space-y-2">
              <Label>Study Level</Label>
              <Select value={studyLevel} onValueChange={setStudyLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select study level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-school">High School</SelectItem>
                  <SelectItem value="college">College/University</SelectItem>
                  <SelectItem value="graduate">Graduate School</SelectItem>
                  <SelectItem value="professional">
                    Professional Development
                  </SelectItem>
                  <SelectItem value="self-study">Self Study</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={practiceQuestionsId}
                  checked={includePracticeQuestions}
                  onCheckedChange={(checked) =>
                    setIncludePracticeQuestions(checked as boolean)
                  }
                />
                <Label htmlFor={practiceQuestionsId}>
                  Include Practice Questions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={summaryId}
                  checked={includeSummary}
                  onCheckedChange={(checked) =>
                    setIncludeSummary(checked as boolean)
                  }
                />
                <Label htmlFor={summaryId}>Include Summary</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !notes || !subject}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Study Guide...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Study Guide
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Guide</CardTitle>
            <CardDescription>
              Your comprehensive study guide will appear here.
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
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Generate Study Guide" to get
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
