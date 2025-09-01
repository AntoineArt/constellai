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

export default function CitationGenerator() {
  const [sourceInformation, setSourceInformation] = useState("");
  const [citationStyle, setCitationStyle] = useState("");
  const [includeMultipleFormats, setIncludeMultipleFormats] = useState(true);
  const [includeBibliography, setIncludeBibliography] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sourceInfoRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const multipleFormatsId = useId();
  const bibliographyId = useId();

  const { addToHistory, getHistory } = useToolHistory(
    TOOL_IDS.CITATION_GENERATOR
  );
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setSourceInformation(lastExecution.inputs.sourceInformation || "");
      setCitationStyle(lastExecution.inputs.citationStyle || "");
      setIncludeMultipleFormats(
        lastExecution.inputs.includeMultipleFormats ?? true
      );
      setIncludeBibliography(lastExecution.inputs.includeBibliography ?? false);
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (sourceInfoRef.current) {
      sourceInfoRef.current.style.height = "auto";
      sourceInfoRef.current.style.height = `${sourceInfoRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!sourceInformation || !citationStyle) return;

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

      const response = await fetch("/api/citation-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          sourceInformation,
          citationStyle,
          includeMultipleFormats,
          includeBibliography,
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
          sourceInformation,
          citationStyle,
          includeMultipleFormats,
          includeBibliography,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error generating citations:", error);
        setResult("Error generating citations. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    sourceInformation,
    citationStyle,
    includeMultipleFormats,
    includeBibliography,
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
        <h1 className="text-3xl font-bold mb-2">Citation Generator</h1>
        <p className="text-muted-foreground">
          Generate proper citations in various academic formats.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Citations
            </CardTitle>
            <CardDescription>
              Create properly formatted citations for your sources.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Source Information</Label>
              <Textarea
                ref={sourceInfoRef}
                id={inputId}
                value={sourceInformation}
                onChange={(e) => setSourceInformation(e.target.value)}
                placeholder="Enter source details: title, author, publication date, URL, etc..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Citation Style</Label>
              <Select value={citationStyle} onValueChange={setCitationStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select citation style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apa">
                    APA (American Psychological Association)
                  </SelectItem>
                  <SelectItem value="mla">
                    MLA (Modern Language Association)
                  </SelectItem>
                  <SelectItem value="chicago">
                    Chicago Manual of Style
                  </SelectItem>
                  <SelectItem value="harvard">Harvard Referencing</SelectItem>
                  <SelectItem value="ieee">
                    IEEE (Institute of Electrical and Electronics Engineers)
                  </SelectItem>
                  <SelectItem value="vancouver">Vancouver</SelectItem>
                  <SelectItem value="ama">
                    AMA (American Medical Association)
                  </SelectItem>
                  <SelectItem value="acs">
                    ACS (American Chemical Society)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={multipleFormatsId}
                  checked={includeMultipleFormats}
                  onCheckedChange={(checked) =>
                    setIncludeMultipleFormats(checked as boolean)
                  }
                />
                <Label htmlFor={multipleFormatsId}>
                  Include Multiple Formats
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={bibliographyId}
                  checked={includeBibliography}
                  onCheckedChange={(checked) =>
                    setIncludeBibliography(checked as boolean)
                  }
                />
                <Label htmlFor={bibliographyId}>
                  Include Bibliography Entry
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !sourceInformation || !citationStyle}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Citations...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Citations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Citations</CardTitle>
            <CardDescription>
              Your properly formatted citations will appear here.
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
                  Fill in the form and click "Generate Citations" to get
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
