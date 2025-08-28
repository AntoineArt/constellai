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
import { TrendingUp, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function TrendAnalyzer() {
  const [dataset, setDataset] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [trendType, setTrendType] = useState("");
  const [includePredictions, setIncludePredictions] = useState(true);
  const [includeActionableInsights, setIncludeActionableInsights] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const datasetRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const timePeriodId = useId();
  const predictionsId = useId();
  const insightsId = useId();

  const { addToHistory, getHistory } = useToolHistory(TOOL_IDS.TREND_ANALYZER);
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setDataset(lastExecution.inputs.dataset || "");
      setTimePeriod(lastExecution.inputs.timePeriod || "");
      setTrendType(lastExecution.inputs.trendType || "");
      setIncludePredictions(lastExecution.inputs.includePredictions ?? true);
      setIncludeActionableInsights(
        lastExecution.inputs.includeActionableInsights ?? false
      );
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (datasetRef.current) {
      datasetRef.current.style.height = "auto";
      datasetRef.current.style.height = `${datasetRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!dataset || !timePeriod) return;

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

      const response = await fetch("/api/trend-analyzer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          dataset,
          timePeriod,
          trendType,
          includePredictions,
          includeActionableInsights,
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
          dataset,
          timePeriod,
          trendType,
          includePredictions,
          includeActionableInsights,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error analyzing trends:", error);
        setResult("Error analyzing trends. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    dataset,
    timePeriod,
    trendType,
    includePredictions,
    includeActionableInsights,
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
        <h1 className="text-3xl font-bold mb-2">Trend Analyzer</h1>
        <p className="text-muted-foreground">
          Identify patterns in data and market trends with actionable insights.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analyze Trends
            </CardTitle>
            <CardDescription>
              Discover patterns and trends in your data with predictive
              insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Dataset Description</Label>
              <Textarea
                ref={datasetRef}
                id={inputId}
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                placeholder="Describe your dataset, metrics, and key variables..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={timePeriodId}>Time Period</Label>
              <Input
                id={timePeriodId}
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                placeholder="e.g., Last 12 months, Q1-Q4 2023, Daily data for 6 months"
              />
            </div>

            <div className="space-y-2">
              <Label>Trend Type</Label>
              <Select value={trendType} onValueChange={setTrendType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trend type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market-trends">Market Trends</SelectItem>
                  <SelectItem value="user-behavior">User Behavior</SelectItem>
                  <SelectItem value="sales-performance">
                    Sales Performance
                  </SelectItem>
                  <SelectItem value="website-analytics">
                    Website Analytics
                  </SelectItem>
                  <SelectItem value="social-media">
                    Social Media Trends
                  </SelectItem>
                  <SelectItem value="financial-data">Financial Data</SelectItem>
                  <SelectItem value="customer-feedback">
                    Customer Feedback
                  </SelectItem>
                  <SelectItem value="product-usage">Product Usage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={predictionsId}
                  checked={includePredictions}
                  onCheckedChange={(checked) =>
                    setIncludePredictions(checked as boolean)
                  }
                />
                <Label htmlFor={predictionsId}>
                  Include Future Predictions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={insightsId}
                  checked={includeActionableInsights}
                  onCheckedChange={(checked) =>
                    setIncludeActionableInsights(checked as boolean)
                  }
                />
                <Label htmlFor={insightsId}>Include Actionable Insights</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !dataset || !timePeriod}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Trends...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Analyze Trends
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trend Analysis Results</CardTitle>
            <CardDescription>
              Your trend analysis and insights will appear here.
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
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Analyze Trends" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
