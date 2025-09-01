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

export default function ProcessDocumenter() {
  const [processDescription, setProcessDescription] = useState("");
  const [processType, setProcessType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [currentProcess, setCurrentProcess] = useState("");
  const [includeScreenshots, setIncludeScreenshots] = useState(true);
  const [includeTroubleshooting, setIncludeTroubleshooting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const processDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const currentProcessRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const targetAudienceId = useId();
  const currentProcessId = useId();
  const screenshotsId = useId();
  const troubleshootingId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.PROCESS_DOCUMENTER
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setProcessDescription(lastExecution.inputs.processDescription || "");
      setProcessType(lastExecution.inputs.processType || "");
      setTargetAudience(lastExecution.inputs.targetAudience || "");
      setCurrentProcess(lastExecution.inputs.currentProcess || "");
      setIncludeScreenshots(lastExecution.inputs.includeScreenshots ?? true);
      setIncludeTroubleshooting(
        lastExecution.inputs.includeTroubleshooting ?? false
      );
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (processDescriptionRef.current) {
      processDescriptionRef.current.style.height = "auto";
      processDescriptionRef.current.style.height = `${processDescriptionRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (currentProcessRef.current) {
      currentProcessRef.current.style.height = "auto";
      currentProcessRef.current.style.height = `${currentProcessRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!processDescription) return;

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

      const response = await fetch("/api/process-documenter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          processDescription,
          processType,
          targetAudience,
          currentProcess,
          includeScreenshots,
          includeTroubleshooting,
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
          processDescription,
          processType,
          targetAudience,
          currentProcess,
          includeScreenshots,
          includeTroubleshooting,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error documenting process:", error);
        setResult("Error documenting process. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    processDescription,
    processType,
    targetAudience,
    currentProcess,
    includeScreenshots,
    includeTroubleshooting,
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
        <h1 className="text-3xl font-bold mb-2">Process Documenter</h1>
        <p className="text-muted-foreground">
          Create step-by-step process documentation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Process
            </CardTitle>
            <CardDescription>
              Create comprehensive, step-by-step process documentation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Process Description</Label>
              <Textarea
                ref={processDescriptionRef}
                id={inputId}
                value={processDescription}
                onChange={(e) => setProcessDescription(e.target.value)}
                placeholder="Describe the process you want to document..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Process Type</Label>
              <Select value={processType} onValueChange={setProcessType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select process type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workflow">Workflow Process</SelectItem>
                  <SelectItem value="technical">Technical Process</SelectItem>
                  <SelectItem value="administrative">
                    Administrative Process
                  </SelectItem>
                  <SelectItem value="customer-service">
                    Customer Service Process
                  </SelectItem>
                  <SelectItem value="quality-control">
                    Quality Control Process
                  </SelectItem>
                  <SelectItem value="onboarding">Onboarding Process</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={targetAudienceId}>Target Audience</Label>
              <Input
                id={targetAudienceId}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., New employees, Technical staff, Customers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={currentProcessId}>
                Current Process (Optional)
              </Label>
              <Textarea
                ref={currentProcessRef}
                id={currentProcessId}
                value={currentProcess}
                onChange={(e) => setCurrentProcess(e.target.value)}
                placeholder="Describe the current process if it exists..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={screenshotsId}
                  checked={includeScreenshots}
                  onCheckedChange={(checked) =>
                    setIncludeScreenshots(checked as boolean)
                  }
                />
                <Label htmlFor={screenshotsId}>
                  Include Screenshot Placeholders
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={troubleshootingId}
                  checked={includeTroubleshooting}
                  onCheckedChange={(checked) =>
                    setIncludeTroubleshooting(checked as boolean)
                  }
                />
                <Label htmlFor={troubleshootingId}>
                  Include Troubleshooting Section
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !processDescription}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Documenting Process...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Document Process
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Process Documentation</CardTitle>
            <CardDescription>
              Your step-by-step process documentation will appear here.
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
                  Fill in the form and click "Document Process" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
