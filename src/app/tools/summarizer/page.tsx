"use client";

import { useState } from "react";
import { FileText, Sparkles, Copy, CheckCircle2 } from "lucide-react";

import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useApiKey } from "@/hooks/use-api-key";

const summaryTypes = [
  {
    id: "brief",
    name: "Brief Summary",
    description: "Quick overview in 2-3 sentences",
  },
  {
    id: "detailed",
    name: "Detailed Summary",
    description: "Comprehensive summary with key points",
  },
  {
    id: "bullet-points",
    name: "Bullet Points",
    description: "Key points in bullet format",
  },
  {
    id: "executive",
    name: "Executive Summary",
    description: "Business-focused summary",
  },
];

const models = [
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash" },
];

export default function SummarizerPage() {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryType, setSummaryType] = useState("brief");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const { hasApiKey, apiKey } = useApiKey();

  const handleSummarize = async () => {
    if (!inputText.trim() || !hasApiKey) return;

    setIsProcessing(true);
    setProgress(0);
    setSummary("");

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          text: inputText,
          summaryType,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to summarize text");
      }

      const result = await response.json();

      clearInterval(progressInterval);
      setProgress(100);
      setSummary(result.summary);

      setTimeout(() => setProgress(0), 1000);
    } catch (error) {
      console.error("Error summarizing text:", error);
      clearInterval(progressInterval);
      setProgress(0);
      setSummary(
        "Failed to summarize text. Please check your API key and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const generateMockSummary = (text: string, type: string): string => {
    const wordCount = text.split(/\s+/).length;
    const selectedSummaryType = summaryTypes.find((t) => t.id === type);

    switch (type) {
      case "brief":
        return `This text contains approximately ${wordCount} words covering various topics. The main themes include key concepts and important information. This summary was generated using ${models.find((m) => m.id === selectedModel)?.name}.`;

      case "detailed":
        return `**Detailed Summary**\n\nThis document contains ${wordCount} words and covers several important topics. The content discusses various themes and presents information in a structured manner.\n\n**Key Areas:**\n- Main concepts and ideas\n- Supporting details and examples\n- Important conclusions and insights\n\nThe analysis was performed using ${models.find((m) => m.id === selectedModel)?.name} to extract the most relevant information while maintaining context and meaning.`;

      case "bullet-points":
        return `**Key Points Summary:**\n\n• Document contains ${wordCount} words\n• Covers multiple important topics\n• Presents structured information\n• Contains relevant examples and details\n• Provides valuable insights and conclusions\n• Processed using ${models.find((m) => m.id === selectedModel)?.name}`;

      case "executive":
        return `**Executive Summary**\n\n**Overview:** This ${wordCount}-word document presents comprehensive information on key topics relevant to business operations.\n\n**Strategic Insights:** The content provides actionable insights and data-driven conclusions that can inform decision-making processes.\n\n**Recommendations:** Based on the analysis using ${models.find((m) => m.id === selectedModel)?.name}, the key takeaways suggest focused attention on the highlighted areas for optimal outcomes.\n\n**Impact:** Implementation of the discussed concepts could result in improved performance and strategic advantages.`;

      default:
        return "Summary generated successfully.";
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = inputText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const charCount = inputText.length;

  const toolActions = (
    <div className="flex items-center gap-2">
      <Select value={selectedModel} onValueChange={setSelectedModel}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleSummarize}
        disabled={!inputText.trim() || !hasApiKey || isProcessing}
      >
        <Sparkles className="h-4 w-4" />
        {isProcessing ? "Processing..." : "Summarize"}
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen flex-col">
      <TopBar title="Text Summarizer" actions={toolActions} />

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Input Text
                  </CardTitle>
                  <CardDescription>
                    Paste or type the text you want to summarize
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!hasApiKey ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <p className="text-sm text-destructive">
                        Please set your API key in the top bar to summarize text
                      </p>
                    </div>
                  ) : (
                    <>
                      <Textarea
                        placeholder="Paste your text here..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="min-h-[300px]"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          {wordCount} words, {charCount} characters
                        </span>
                        <Badge variant="outline">
                          {wordCount > 1000
                            ? "Long"
                            : wordCount > 500
                              ? "Medium"
                              : "Short"}{" "}
                          text
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Summary Settings</CardTitle>
                  <CardDescription>
                    Choose the type of summary you want
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Summary Type
                      </label>
                      <Select
                        value={summaryType}
                        onValueChange={setSummaryType}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {summaryTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="text-left">
                                <div className="font-medium">{type.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {type.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Output Section */}
            <div className="space-y-4">
              {isProcessing && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        <span className="text-sm font-medium">
                          Processing your text...
                        </span>
                      </div>
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        Using {models.find((m) => m.id === selectedModel)?.name}{" "}
                        to generate a{" "}
                        {summaryTypes
                          .find((t) => t.id === summaryType)
                          ?.name.toLowerCase()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {summary && !isProcessing && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Summary</CardTitle>
                        <CardDescription>
                          {
                            summaryTypes.find((t) => t.id === summaryType)
                              ?.description
                          }
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyToClipboard}
                        className="gap-2"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {summary}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge variant="secondary">
                        {models.find((m) => m.id === selectedModel)?.name}
                      </Badge>
                      <Badge variant="outline">
                        {summaryTypes.find((t) => t.id === summaryType)?.name}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!summary && !isProcessing && hasApiKey && (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">
                      Ready to Summarize
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Enter your text and click "Summarize" to get started
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
