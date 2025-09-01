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
import { Table, Loader2, Send, Copy, Check } from "lucide-react";
import { Response } from "@/components/ai-elements/response";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function DecisionMatrixCreator() {
  const [decisionContext, setDecisionContext] = useState("");
  const [decisionType, setDecisionType] = useState("");
  const [options, setOptions] = useState("");
  const [criteria, setCriteria] = useState("");
  const [includeWeights, setIncludeWeights] = useState(true);
  const [includeScoring, setIncludeScoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const decisionContextRef = useRef<HTMLTextAreaElement>(null);
  const optionsRef = useRef<HTMLTextAreaElement>(null);
  const criteriaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const optionsId = useId();
  const criteriaId = useId();
  const weightsId = useId();
  const scoringId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.DECISION_MATRIX_CREATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setDecisionContext(lastExecution.inputs.decisionContext || "");
      setDecisionType(lastExecution.inputs.decisionType || "");
      setOptions(lastExecution.inputs.options || "");
      setCriteria(lastExecution.inputs.criteria || "");
      setIncludeWeights(lastExecution.inputs.includeWeights ?? true);
      setIncludeScoring(lastExecution.inputs.includeScoring ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (decisionContextRef.current) {
      decisionContextRef.current.style.height = "auto";
      decisionContextRef.current.style.height = `${decisionContextRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (optionsRef.current) {
      optionsRef.current.style.height = "auto";
      optionsRef.current.style.height = `${optionsRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (criteriaRef.current) {
      criteriaRef.current.style.height = "auto";
      criteriaRef.current.style.height = `${criteriaRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!decisionContext || !options) return;

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

      const response = await fetch("/api/decision-matrix-creator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          decisionContext,
          decisionType,
          options,
          criteria,
          includeWeights,
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
          decisionContext,
          decisionType,
          options,
          criteria,
          includeWeights,
          includeScoring,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error creating decision matrix:", error);
        setResult("Error creating decision matrix. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    decisionContext,
    decisionType,
    options,
    criteria,
    includeWeights,
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
        <h1 className="text-3xl font-bold mb-2">Decision Matrix Creator</h1>
        <p className="text-muted-foreground">
          Generate decision-making frameworks and analysis tools.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Create Decision Matrix
            </CardTitle>
            <CardDescription>
              Build a structured framework to evaluate options and make informed
              decisions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Decision Context</Label>
              <Textarea
                ref={decisionContextRef}
                id={inputId}
                value={decisionContext}
                onChange={(e) => setDecisionContext(e.target.value)}
                placeholder="Describe the decision you need to make and its context..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Decision Type</Label>
              <Select value={decisionType} onValueChange={setDecisionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business Decision</SelectItem>
                  <SelectItem value="personal">Personal Decision</SelectItem>
                  <SelectItem value="purchase">Purchase Decision</SelectItem>
                  <SelectItem value="career">Career Decision</SelectItem>
                  <SelectItem value="project">Project Decision</SelectItem>
                  <SelectItem value="investment">
                    Investment Decision
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={optionsId}>Options/Alternatives</Label>
              <Textarea
                ref={optionsRef}
                id={optionsId}
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="List all the options or alternatives you're considering..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={criteriaId}>Evaluation Criteria</Label>
              <Textarea
                ref={criteriaRef}
                id={criteriaId}
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="List the criteria you'll use to evaluate each option..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={weightsId}
                  checked={includeWeights}
                  onCheckedChange={(checked) =>
                    setIncludeWeights(checked as boolean)
                  }
                />
                <Label htmlFor={weightsId}>Include Criteria Weights</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={scoringId}
                  checked={includeScoring}
                  onCheckedChange={(checked) =>
                    setIncludeScoring(checked as boolean)
                  }
                />
                <Label htmlFor={scoringId}>Include Scoring System</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !decisionContext || !options}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Matrix...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Matrix
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decision Matrix</CardTitle>
            <CardDescription>
              Your decision-making framework will appear here.
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
                <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Create Matrix" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
