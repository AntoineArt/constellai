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
import { HelpCircle, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function QuizGenerator() {
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [questionTypes, setQuestionTypes] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState("");
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const subjectId = useId();
  const questionTypesId = useId();
  const numberOfQuestionsId = useId();
  const answersId = useId();

  const { addToHistory, getHistory } = useToolHistory(TOOL_IDS.QUIZ_GENERATOR);
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setContent(lastExecution.inputs.content || "");
      setSubject(lastExecution.inputs.subject || "");
      setGradeLevel(lastExecution.inputs.gradeLevel || "");
      setQuestionTypes(lastExecution.inputs.questionTypes || "");
      setNumberOfQuestions(lastExecution.inputs.numberOfQuestions || "");
      setIncludeAnswers(lastExecution.inputs.includeAnswers ?? true);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!content || !subject) return;

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

      const response = await fetch("/api/quiz-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          content,
          subject,
          gradeLevel,
          questionTypes,
          numberOfQuestions,
          includeAnswers,
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
          content,
          subject,
          gradeLevel,
          questionTypes,
          numberOfQuestions,
          includeAnswers,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error generating quiz:", error);
        setResult("Error generating quiz. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    content,
    subject,
    gradeLevel,
    questionTypes,
    numberOfQuestions,
    includeAnswers,
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
        <h1 className="text-3xl font-bold mb-2">Quiz Generator</h1>
        <p className="text-muted-foreground">
          Create educational quizzes from content with various question types.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Generate Quiz
            </CardTitle>
            <CardDescription>
              Create engaging educational quizzes from your content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Content</Label>
              <Textarea
                ref={contentRef}
                id={inputId}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the educational content you want to create a quiz from..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={subjectId}>Subject</Label>
              <Input
                id={subjectId}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Mathematics, Science, History"
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
              <Label htmlFor={questionTypesId}>Question Types</Label>
              <Input
                id={questionTypesId}
                value={questionTypes}
                onChange={(e) => setQuestionTypes(e.target.value)}
                placeholder="e.g., Multiple choice, True/False, Short answer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={numberOfQuestionsId}>Number of Questions</Label>
              <Input
                id={numberOfQuestionsId}
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)}
                placeholder="e.g., 10, 15, 20"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={answersId}
                  checked={includeAnswers}
                  onCheckedChange={(checked) =>
                    setIncludeAnswers(checked as boolean)
                  }
                />
                <Label htmlFor={answersId}>Include Answer Key</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !content || !subject}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Quiz</CardTitle>
            <CardDescription>
              Your educational quiz will appear here.
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
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Generate Quiz" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
