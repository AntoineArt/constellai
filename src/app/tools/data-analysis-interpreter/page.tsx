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
import { BarChart, Loader2, Send, Copy, Check } from "lucide-react";
import { Response } from "@/components/ai-elements/response";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function DataAnalysisInterpreter() {
  const [dataDescription, setDataDescription] = useState("");
  const [analysisResults, setAnalysisResults] = useState("");
  const [statisticalTests, setStatisticalTests] = useState("");
  const [includePlainLanguage, setIncludePlainLanguage] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const dataDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const analysisResultsRef = useRef<HTMLTextAreaElement>(null);
  const statisticalTestsRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const analysisResultsId = useId();
  const statisticalTestsId = useId();
  const plainLanguageId = useId();
  const recommendationsId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.DATA_ANALYSIS_INTERPRETER
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setDataDescription(lastExecution.inputs.dataDescription || "");
      setAnalysisResults(lastExecution.inputs.analysisResults || "");
      setStatisticalTests(lastExecution.inputs.statisticalTests || "");
      setIncludePlainLanguage(
        lastExecution.inputs.includePlainLanguage ?? true
      );
      setIncludeRecommendations(
        lastExecution.inputs.includeRecommendations ?? false
      );
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (dataDescriptionRef.current) {
      dataDescriptionRef.current.style.height = "auto";
      dataDescriptionRef.current.style.height = `${dataDescriptionRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (analysisResultsRef.current) {
      analysisResultsRef.current.style.height = "auto";
      analysisResultsRef.current.style.height = `${analysisResultsRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (statisticalTestsRef.current) {
      statisticalTestsRef.current.style.height = "auto";
      statisticalTestsRef.current.style.height = `${statisticalTestsRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!dataDescription || !analysisResults) return;

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

      const response = await fetch("/api/data-analysis-interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          dataDescription,
          analysisResults,
          statisticalTests,
          includePlainLanguage,
          includeRecommendations,
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
          dataDescription,
          analysisResults,
          statisticalTests,
          includePlainLanguage,
          includeRecommendations,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error interpreting data analysis:", error);
        setResult("Error interpreting data analysis. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    dataDescription,
    analysisResults,
    statisticalTests,
    includePlainLanguage,
    includeRecommendations,
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
        <h1 className="text-3xl font-bold mb-2">Data Analysis Interpreter</h1>
        <p className="text-muted-foreground">
          Explain statistical analyses and data insights in plain language.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Interpret Data Analysis
            </CardTitle>
            <CardDescription>
              Transform complex statistical results into clear, understandable
              insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Data Description</Label>
              <Textarea
                ref={dataDescriptionRef}
                id={inputId}
                value={dataDescription}
                onChange={(e) => setDataDescription(e.target.value)}
                placeholder="Describe your dataset, variables, and research context..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={analysisResultsId}>Analysis Results</Label>
              <Textarea
                ref={analysisResultsRef}
                id={analysisResultsId}
                value={analysisResults}
                onChange={(e) => setAnalysisResults(e.target.value)}
                placeholder="Paste your statistical analysis results, p-values, effect sizes, etc..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={statisticalTestsId}>Statistical Tests Used</Label>
              <Textarea
                ref={statisticalTestsRef}
                id={statisticalTestsId}
                value={statisticalTests}
                onChange={(e) => setStatisticalTests(e.target.value)}
                placeholder="List the statistical tests, methods, and software used..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={plainLanguageId}
                  checked={includePlainLanguage}
                  onCheckedChange={(checked) =>
                    setIncludePlainLanguage(checked as boolean)
                  }
                />
                <Label htmlFor={plainLanguageId}>
                  Include Plain Language Explanation
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={recommendationsId}
                  checked={includeRecommendations}
                  onCheckedChange={(checked) =>
                    setIncludeRecommendations(checked as boolean)
                  }
                />
                <Label htmlFor={recommendationsId}>
                  Include Actionable Recommendations
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !dataDescription || !analysisResults}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Interpreting Analysis...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Interpret Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interpretation Results</CardTitle>
            <CardDescription>
              Your data analysis interpretation will appear here.
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
                <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Interpret Analysis" to get
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
