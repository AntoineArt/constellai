"use client";

import { useCallback, useRef, useState, useEffect, useId } from "react";
import type { ChatStatus } from "ai";

import { TopBar } from "@/components/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ToolHistorySidebar } from "@/components/tool-history-sidebar";
import { useApiKey } from "@/hooks/use-api-key";
import { useToolHistory, usePreferences, TOOL_IDS } from "@/lib/storage";
import { Copy, RotateCcw, Trash2 } from "lucide-react";

export default function HeadlineGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.HEADLINE_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const topicId = useId();
  const targetAudienceId = useId();
  const seoId = useId();
  const emotionalId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("article");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [includeSEO, setIncludeSEO] = useState(true);
  const [includeEmotional, setIncludeEmotional] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const topicRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.topic) {
        setTopic(execution.inputs.topic);
      }
      if (execution.inputs?.contentType) {
        setContentType(execution.inputs.contentType);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.tone) {
        setTone(execution.inputs.tone);
      }
      if (execution.inputs?.length) {
        setLength(execution.inputs.length);
      }
      if (execution.inputs?.includeSEO !== undefined) {
        setIncludeSEO(execution.inputs.includeSEO);
      }
      if (execution.inputs?.includeEmotional !== undefined) {
        setIncludeEmotional(execution.inputs.includeEmotional);
      }
      if (execution.outputs?.result) {
        setResult(execution.outputs.result);
      }
      if (execution.settings?.selectedModel) {
        setSelectedModel(execution.settings.selectedModel);
      }
    }
  }, [toolHistory.isLoaded, toolHistory.currentExecution]);

  // Auto-focus input when API key is available
  useEffect(() => {
    if (hasApiKey && topicRef.current) {
      topicRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setTopic("");
    setContentType("article");
    setTargetAudience("");
    setTone("professional");
    setLength("medium");
    setIncludeSEO(true);
    setIncludeEmotional(true);
    setResult("");
    toolHistory.clearActiveExecution();
  }, [status, toolHistory]);

  const copyResult = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
    } catch (error) {
      console.error("Failed to copy result:", error);
    }
  }, [result]);

  const handleSubmit = useCallback(async () => {
    if (
      !hasApiKey ||
      status === "submitted" ||
      status === "streaming" ||
      !topic.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/headline-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          contentType,
          targetAudience: targetAudience.trim(),
          tone,
          length,
          includeSEO,
          includeEmotional,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      if (!response.body) {
        const text = await response.text();
        setResult(text);
        setStatus(undefined);
        controllerRef.current = null;
        return;
      }

      setStatus("streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let resultContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultContent += decoder.decode(value, { stream: true });
        setResult(resultContent);
      }

      resultContent += decoder.decode();
      setResult(resultContent);

      controllerRef.current = null;
      setStatus(undefined);

      // Save execution
      if (!toolHistory.currentExecution) {
        await toolHistory.createNewExecution(
          {
            topic: topic.trim(),
            contentType,
            targetAudience: targetAudience.trim(),
            tone,
            length,
            includeSEO,
            includeEmotional,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          topic: topic.trim(),
          contentType,
          targetAudience: targetAudience.trim(),
          tone,
          length,
          includeSEO,
          includeEmotional,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating headlines.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    topic,
    contentType,
    targetAudience,
    tone,
    length,
    includeSEO,
    includeEmotional,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateHeadlines = useCallback(async () => {
    if (status === "streaming" || !topic.trim()) return;
    await handleSubmit();
  }, [status, topic, handleSubmit]);

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await handleSubmit();
    },
    [handleSubmit]
  );

  return (
    <div className="h-screen overflow-hidden flex">
      {/* Tool History Sidebar */}
      <ToolHistorySidebar
        executions={toolHistory.executions}
        activeExecutionId={toolHistory.activeExecutionId}
        onSelectExecution={toolHistory.switchToExecution}
        onDeleteExecution={toolHistory.deleteExecution}
        onRenameExecution={toolHistory.renameExecution}
        onNewExecution={async () => {
          if (status !== "streaming") {
            clearForm();
            await toolHistory.createNewExecution(
              {
                topic: "",
                contentType: "article",
                targetAudience: "",
                tone: "professional",
                length: "medium",
                includeSEO: true,
                includeEmotional: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Headline Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Headline Generator"
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate headlines
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-6">
              {/* Input Form */}
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={topicId}>Topic/Subject *</Label>
                      <Input
                        ref={topicRef}
                        id={topicId}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What is your content about?"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select
                          value={contentType}
                          onValueChange={setContentType}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="blog-post">Blog Post</SelectItem>
                            <SelectItem value="news-story">
                              News Story
                            </SelectItem>
                            <SelectItem value="product-page">
                              Product Page
                            </SelectItem>
                            <SelectItem value="landing-page">
                              Landing Page
                            </SelectItem>
                            <SelectItem value="email-subject">
                              Email Subject
                            </SelectItem>
                            <SelectItem value="social-media">
                              Social Media Post
                            </SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="podcast">Podcast</SelectItem>
                            <SelectItem value="webinar">Webinar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Headline Length</Label>
                        <Select value={length} onValueChange={setLength}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">
                              Short (5-10 words)
                            </SelectItem>
                            <SelectItem value="medium">
                              Medium (10-15 words)
                            </SelectItem>
                            <SelectItem value="long">
                              Long (15+ words)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={targetAudienceId}>
                          Target Audience
                        </Label>
                        <Input
                          id={targetAudienceId}
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="Who is your target audience?"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tone</Label>
                        <Select value={tone} onValueChange={setTone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">
                              Professional
                            </SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="authoritative">
                              Authoritative
                            </SelectItem>
                            <SelectItem value="humorous">Humorous</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="inspirational">
                              Inspirational
                            </SelectItem>
                            <SelectItem value="educational">
                              Educational
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Headline Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={seoId}
                            checked={includeSEO}
                            onCheckedChange={(checked) =>
                              setIncludeSEO(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={seoId}
                            className="text-sm font-normal"
                          >
                            Include SEO-optimized headlines
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={emotionalId}
                            checked={includeEmotional}
                            onCheckedChange={(checked) =>
                              setIncludeEmotional(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={emotionalId}
                            className="text-sm font-normal"
                          >
                            Include emotionally compelling headlines
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!topic.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Headlines"}
                      </Button>
                      {status === "streaming" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (controllerRef.current) {
                              controllerRef.current.abort();
                              controllerRef.current = null;
                              setStatus(undefined);
                            }
                          }}
                        >
                          Stop
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={regenerateHeadlines}
                        disabled={
                          status === "streaming" || !topic.trim() || !result
                        }
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearForm}
                        disabled={status === "streaming"}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Results */}
              {result && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Generated Headlines
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyResult}
                        disabled={copiedResult}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {copiedResult ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                        {result}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading indicator */}
              {(status === "submitted" || status === "streaming") &&
                !result && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {status === "submitted"
                            ? "Analyzing topic and requirements..."
                            : "Generating compelling headlines..."}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
