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
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function MeetingMinutesGenerator() {
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [participants, setParticipants] = useState("");
  const [duration, setDuration] = useState("");
  const [includeActionItems, setIncludeActionItems] = useState(true);
  const [includeDecisions, setIncludeDecisions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const meetingNotesRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const participantsId = useId();
  const durationId = useId();
  const actionItemsId = useId();
  const decisionsId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.MEETING_MINUTES_GENERATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setMeetingNotes(lastExecution.inputs.meetingNotes || "");
      setMeetingType(lastExecution.inputs.meetingType || "");
      setParticipants(lastExecution.inputs.participants || "");
      setDuration(lastExecution.inputs.duration || "");
      setIncludeActionItems(lastExecution.inputs.includeActionItems ?? true);
      setIncludeDecisions(lastExecution.inputs.includeDecisions ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (meetingNotesRef.current) {
      meetingNotesRef.current.style.height = "auto";
      meetingNotesRef.current.style.height = `${meetingNotesRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!meetingNotes || !meetingType) return;

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

      const response = await fetch("/api/meeting-minutes-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          meetingNotes,
          meetingType,
          participants,
          duration,
          includeActionItems,
          includeDecisions,
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
          meetingNotes,
          meetingType,
          participants,
          duration,
          includeActionItems,
          includeDecisions,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error generating meeting minutes:", error);
        setResult("Error generating meeting minutes. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    meetingNotes,
    meetingType,
    participants,
    duration,
    includeActionItems,
    includeDecisions,
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
        <h1 className="text-3xl font-bold mb-2">Meeting Minutes Generator</h1>
        <p className="text-muted-foreground">
          Convert recordings/notes to structured meeting minutes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Generate Meeting Minutes
            </CardTitle>
            <CardDescription>
              Transform meeting notes into structured, professional minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Meeting Notes</Label>
              <Textarea
                ref={meetingNotesRef}
                id={inputId}
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Paste your meeting notes, recording transcript, or key discussion points..."
                className="min-h-[150px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Meeting Type</Label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team-meeting">Team Meeting</SelectItem>
                  <SelectItem value="project-review">Project Review</SelectItem>
                  <SelectItem value="client-meeting">Client Meeting</SelectItem>
                  <SelectItem value="board-meeting">Board Meeting</SelectItem>
                  <SelectItem value="planning-session">
                    Planning Session
                  </SelectItem>
                  <SelectItem value="status-update">Status Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={participantsId}>Participants</Label>
              <Input
                id={participantsId}
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="e.g., John Smith, Jane Doe, Mike Johnson"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={durationId}>Meeting Duration</Label>
              <Input
                id={durationId}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 1 hour, 90 minutes, 2 hours"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={actionItemsId}
                  checked={includeActionItems}
                  onCheckedChange={(checked) =>
                    setIncludeActionItems(checked as boolean)
                  }
                />
                <Label htmlFor={actionItemsId}>Include Action Items</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={decisionsId}
                  checked={includeDecisions}
                  onCheckedChange={(checked) =>
                    setIncludeDecisions(checked as boolean)
                  }
                />
                <Label htmlFor={decisionsId}>Include Key Decisions</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !meetingNotes || !meetingType}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Minutes...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Minutes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meeting Minutes</CardTitle>
            <CardDescription>
              Your structured meeting minutes will appear here.
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
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Generate Minutes" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
