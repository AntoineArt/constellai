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
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function AbstractGenerator() {
  const [paperContent, setPaperContent] = useState("");
  const [abstractType, setAbstractType] = useState("");
  const [wordLimit, setWordLimit] = useState("");
  const [includeKeywords, setIncludeKeywords] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const paperContentRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const wordLimitId = useId();
  const keywordsId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.ABSTRACT_GENERATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setPaperContent(lastExecution.inputs.paperContent || "");
      setAbstractType(lastExecution.inputs.abstractType || "");
      setWordLimit(lastExecution.inputs.wordLimit || "");
      setIncludeKeywords(lastExecution.inputs.includeKeywords ?? true);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (paperContentRef.current) {
      paperContentRef.current.style.height = "auto";
      paperContentRef.current.style.height = `${paperContentRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!paperContent || !abstractType) return;

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

      const response = await fetch("/api/abstract-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          paperContent,
          abstractType,
          wordLimit,
          includeKeywords,
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
          paperContent,
          abstractType,
          wordLimit,
          includeKeywords,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error generating abstract:", error);
        setResult("Error generating abstract. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    paperContent,
    abstractType,
    wordLimit,
    includeKeywords,
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
        <h1 className="text-3xl font-bold mb-2">Abstract Generator</h1>
        <p className="text-muted-foreground">
          Generate academic abstracts from research papers and content.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Abstract
            </CardTitle>
            <CardDescription>
              Create concise and informative abstracts for your research papers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Paper Content</Label>
              <Textarea
                ref={paperContentRef}
                id={inputId}
                value={paperContent}
                onChange={(e) => setPaperContent(e.target.value)}
                placeholder="Paste your research paper content, main findings, methodology, and conclusions..."
                className="min-h-[150px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Abstract Type</Label>
              <Select value={abstractType} onValueChange={setAbstractType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select abstract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informative">
                    Informative Abstract
                  </SelectItem>
                  <SelectItem value="descriptive">
                    Descriptive Abstract
                  </SelectItem>
                  <SelectItem value="structured">
                    Structured Abstract
                  </SelectItem>
                  <SelectItem value="executive-summary">
                    Executive Summary
                  </SelectItem>
                  <SelectItem value="research-highlight">
                    Research Highlight
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={wordLimitId}>Word Limit</Label>
              <Input
                id={wordLimitId}
                value={wordLimit}
                onChange={(e) => setWordLimit(e.target.value)}
                placeholder="e.g., 250 words, 150-200 words"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={keywordsId}
                  checked={includeKeywords}
                  onCheckedChange={(checked) =>
                    setIncludeKeywords(checked as boolean)
                  }
                />
                <Label htmlFor={keywordsId}>Include Keywords</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !paperContent || !abstractType}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Abstract...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Abstract
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Abstract</CardTitle>
            <CardDescription>
              Your academic abstract will appear here.
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
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Fill in the form and click "Generate Abstract" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
