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
import { Lightbulb, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function HypothesisGenerator() {
  const [researchQuestion, setResearchQuestion] = useState("");
  const [context, setContext] = useState("");
  const [variables, setVariables] = useState("");
  const [includeTestableHypotheses, setIncludeTestableHypotheses] =
    useState(true);
  const [includeResearchDesign, setIncludeResearchDesign] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const researchQuestionRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef<HTMLTextAreaElement>(null);
  const variablesRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const contextId = useId();
  const variablesId = useId();
  const testableHypothesesId = useId();
  const researchDesignId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.HYPOTHESIS_GENERATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setResearchQuestion(lastExecution.inputs.researchQuestion || "");
      setContext(lastExecution.inputs.context || "");
      setVariables(lastExecution.inputs.variables || "");
      setIncludeTestableHypotheses(
        lastExecution.inputs.includeTestableHypotheses ?? true
      );
      setIncludeResearchDesign(
        lastExecution.inputs.includeResearchDesign ?? false
      );
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (researchQuestionRef.current) {
      researchQuestionRef.current.style.height = "auto";
      researchQuestionRef.current.style.height = `${researchQuestionRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.style.height = "auto";
      contextRef.current.style.height = `${contextRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (variablesRef.current) {
      variablesRef.current.style.height = "auto";
      variablesRef.current.style.height = `${variablesRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!researchQuestion) return;

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

      const response = await fetch("/api/hypothesis-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          researchQuestion,
          context,
          variables,
          includeTestableHypotheses,
          includeResearchDesign,
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
          researchQuestion,
          context,
          variables,
          includeTestableHypotheses,
          includeResearchDesign,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error generating hypotheses:", error);
        setResult("Error generating hypotheses. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    researchQuestion,
    context,
    variables,
    includeTestableHypotheses,
    includeResearchDesign,
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
        <h1 className="text-3xl font-bold mb-2">Hypothesis Generator</h1>
        <p className="text-muted-foreground">
          Create testable hypotheses from research questions and observations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Generate Hypotheses
            </CardTitle>
            <CardDescription>
              Create testable, well-formulated hypotheses for your research.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Research Question</Label>
              <Textarea
                ref={researchQuestionRef}
                id={inputId}
                value={researchQuestion}
                onChange={(e) => setResearchQuestion(e.target.value)}
                placeholder="Enter your main research question or problem statement..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={contextId}>Research Context</Label>
              <Textarea
                ref={contextRef}
                id={contextId}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Provide background context, literature review, or theoretical framework..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={variablesId}>Key Variables</Label>
              <Textarea
                ref={variablesRef}
                id={variablesId}
                value={variables}
                onChange={(e) => setVariables(e.target.value)}
                placeholder="List the key variables, factors, or concepts involved in your research..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={testableHypothesesId}
                  checked={includeTestableHypotheses}
                  onCheckedChange={(checked) =>
                    setIncludeTestableHypotheses(checked as boolean)
                  }
                />
                <Label htmlFor={testableHypothesesId}>
                  Include Testable Hypotheses
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={researchDesignId}
                  checked={includeResearchDesign}
                  onCheckedChange={(checked) =>
                    setIncludeResearchDesign(checked as boolean)
                  }
                />
                <Label htmlFor={researchDesignId}>
                  Include Research Design Recommendations
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !researchQuestion}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Hypotheses...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Hypotheses
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Hypotheses</CardTitle>
            <CardDescription>
              Your testable hypotheses and research framework will appear here.
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
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Enter your research question and click "Generate Hypotheses"
                  to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
