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
import { MessageCircle, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function InterviewQuestionGenerator() {
  const [interviewType, setInterviewType] = useState("");
  const [position, setPosition] = useState("");
  const [candidateProfile, setCandidateProfile] = useState("");
  const [includeBehavioralQuestions, setIncludeBehavioralQuestions] =
    useState(true);
  const [includeTechnicalQuestions, setIncludeTechnicalQuestions] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const positionId = useId();
  const candidateProfileId = useId();
  const behavioralId = useId();
  const technicalId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.INTERVIEW_QUESTION_GENERATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setInterviewType(lastExecution.inputs.interviewType || "");
      setPosition(lastExecution.inputs.position || "");
      setCandidateProfile(lastExecution.inputs.candidateProfile || "");
      setIncludeBehavioralQuestions(
        lastExecution.inputs.includeBehavioralQuestions ?? true
      );
      setIncludeTechnicalQuestions(
        lastExecution.inputs.includeTechnicalQuestions ?? false
      );
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!interviewType || !position) return;

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

      const response = await fetch("/api/interview-question-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          interviewType,
          position,
          candidateProfile,
          includeBehavioralQuestions,
          includeTechnicalQuestions,
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
          interviewType,
          position,
          candidateProfile,
          includeBehavioralQuestions,
          includeTechnicalQuestions,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error generating interview questions:", error);
        setResult("Error generating interview questions. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    interviewType,
    position,
    candidateProfile,
    includeBehavioralQuestions,
    includeTechnicalQuestions,
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
        <h1 className="text-3xl font-bold mb-2">
          Interview Question Generator
        </h1>
        <p className="text-muted-foreground">
          Generate targeted interview questions for research and hiring
          purposes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Generate Interview Questions
            </CardTitle>
            <CardDescription>
              Create comprehensive interview questions based on position and
              candidate profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Interview Type</Label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interview type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job-hiring">Job Hiring</SelectItem>
                  <SelectItem value="research-study">Research Study</SelectItem>
                  <SelectItem value="user-research">User Research</SelectItem>
                  <SelectItem value="academic-interview">
                    Academic Interview
                  </SelectItem>
                  <SelectItem value="media-interview">
                    Media Interview
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={positionId}>Position / Role</Label>
              <Input
                id={positionId}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g., Senior Software Engineer, Research Participant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={candidateProfileId}>Candidate Profile</Label>
              <Textarea
                ref={textareaRef}
                id={candidateProfileId}
                value={candidateProfile}
                onChange={(e) => setCandidateProfile(e.target.value)}
                placeholder="Describe the candidate's background, experience, and key characteristics..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={behavioralId}
                  checked={includeBehavioralQuestions}
                  onCheckedChange={(checked) =>
                    setIncludeBehavioralQuestions(checked as boolean)
                  }
                />
                <Label htmlFor={behavioralId}>
                  Include Behavioral Questions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={technicalId}
                  checked={includeTechnicalQuestions}
                  onCheckedChange={(checked) =>
                    setIncludeTechnicalQuestions(checked as boolean)
                  }
                />
                <Label htmlFor={technicalId}>Include Technical Questions</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !interviewType || !position}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Questions
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Questions</CardTitle>
            <CardDescription>
              Your comprehensive interview questions will appear here.
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
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Generate Questions" to get
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
