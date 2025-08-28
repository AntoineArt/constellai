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
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function FactChecker() {
  const [claim, setClaim] = useState("");
  const [context, setContext] = useState("");
  const [includeSourceValidation, setIncludeSourceValidation] = useState(true);
  const [includeDetailedAnalysis, setIncludeDetailedAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const claimRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const contextId = useId();
  const sourceValidationId = useId();
  const detailedAnalysisId = useId();

  const { addToHistory, getHistory } = useToolHistory(TOOL_IDS.FACT_CHECKER);
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setClaim(lastExecution.inputs.claim || "");
      setContext(lastExecution.inputs.context || "");
      setIncludeSourceValidation(
        lastExecution.inputs.includeSourceValidation ?? true
      );
      setIncludeDetailedAnalysis(
        lastExecution.inputs.includeDetailedAnalysis ?? false
      );
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (claimRef.current) {
      claimRef.current.style.height = "auto";
      claimRef.current.style.height = `${claimRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.style.height = "auto";
      contextRef.current.style.height = `${contextRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!claim) return;

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

      const response = await fetch("/api/fact-checker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          claim,
          context,
          includeSourceValidation,
          includeDetailedAnalysis,
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
          claim,
          context,
          includeSourceValidation,
          includeDetailedAnalysis,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error fact-checking:", error);
        setResult("Error fact-checking. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    claim,
    context,
    includeSourceValidation,
    includeDetailedAnalysis,
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
        <h1 className="text-3xl font-bold mb-2">Fact Checker</h1>
        <p className="text-muted-foreground">
          Verify claims and provide source validation for research.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Fact Check Claims
            </CardTitle>
            <CardDescription>
              Verify the accuracy of claims with reliable sources and evidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Claim to Verify</Label>
              <Textarea
                ref={claimRef}
                id={inputId}
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="Enter the claim or statement you want to fact-check..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={contextId}>Additional Context</Label>
              <Textarea
                ref={contextRef}
                id={contextId}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Provide any additional context, sources, or background information..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={sourceValidationId}
                  checked={includeSourceValidation}
                  onCheckedChange={(checked) =>
                    setIncludeSourceValidation(checked as boolean)
                  }
                />
                <Label htmlFor={sourceValidationId}>
                  Include Source Validation
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={detailedAnalysisId}
                  checked={includeDetailedAnalysis}
                  onCheckedChange={(checked) =>
                    setIncludeDetailedAnalysis(checked as boolean)
                  }
                />
                <Label htmlFor={detailedAnalysisId}>
                  Include Detailed Analysis
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !claim}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fact-Checking...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Fact Check
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fact Check Results</CardTitle>
            <CardDescription>
              Your fact-checking report will appear here.
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
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter a claim and click "Fact Check" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
