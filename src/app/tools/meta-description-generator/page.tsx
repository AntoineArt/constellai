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
import { Response } from "@/components/ai-elements/response";

export default function MetaDescriptionGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.META_DESCRIPTION_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const pageTitleId = useId();
  const contentId = useId();
  const keywordsId = useId();
  const targetAudienceId = useId();
  const ctaId = useId();
  const includeKeywordsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [pageTitle, setPageTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetKeywords, setTargetKeywords] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [includeKeywords, setIncludeKeywords] = useState(true);
  const [length, setLength] = useState("standard");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const pageTitleRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.pageTitle) {
        setPageTitle(execution.inputs.pageTitle);
      }
      if (execution.inputs?.content) {
        setContent(execution.inputs.content);
      }
      if (execution.inputs?.targetKeywords) {
        setTargetKeywords(execution.inputs.targetKeywords);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.callToAction) {
        setCallToAction(execution.inputs.callToAction);
      }
      if (execution.inputs?.includeKeywords !== undefined) {
        setIncludeKeywords(execution.inputs.includeKeywords);
      }
      if (execution.inputs?.length) {
        setLength(execution.inputs.length);
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
    if (hasApiKey && pageTitleRef.current) {
      pageTitleRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setPageTitle("");
    setContent("");
    setTargetKeywords("");
    setTargetAudience("");
    setCallToAction("");
    setIncludeKeywords(true);
    setLength("standard");
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
      !pageTitle.trim() ||
      !content.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/meta-description-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          pageTitle: pageTitle.trim(),
          content: content.trim(),
          targetKeywords: targetKeywords.trim(),
          targetAudience: targetAudience.trim(),
          callToAction: callToAction.trim(),
          includeKeywords,
          length,
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
            pageTitle: pageTitle.trim(),
            content: content.trim(),
            targetKeywords: targetKeywords.trim(),
            targetAudience: targetAudience.trim(),
            callToAction: callToAction.trim(),
            includeKeywords,
            length,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          pageTitle: pageTitle.trim(),
          content: content.trim(),
          targetKeywords: targetKeywords.trim(),
          targetAudience: targetAudience.trim(),
          callToAction: callToAction.trim(),
          includeKeywords,
          length,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult(
          "Sorry, an error occurred while generating meta descriptions."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    pageTitle,
    content,
    targetKeywords,
    targetAudience,
    callToAction,
    includeKeywords,
    length,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateDescriptions = useCallback(async () => {
    if (status === "streaming" || !pageTitle.trim() || !content.trim()) return;
    await handleSubmit();
  }, [status, pageTitle, content, handleSubmit]);

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
                pageTitle: "",
                content: "",
                targetKeywords: "",
                targetAudience: "",
                callToAction: "",
                includeKeywords: true,
                length: "standard",
              },
              { selectedModel }
            );
          }
        }}
        toolName="Meta Description Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Meta Description Generator"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate meta descriptions
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
                      <Label htmlFor={pageTitleId}>Page Title *</Label>
                      <Input
                        ref={pageTitleRef}
                        id={pageTitleId}
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                        placeholder="Your page title"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={contentId}>Page Content *</Label>
                      <Textarea
                        id={contentId}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describe your page content, main topics, and key information..."
                        className="min-h-[100px] max-h-[200px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={keywordsId}>Target Keywords</Label>
                        <Input
                          id={keywordsId}
                          value={targetKeywords}
                          onChange={(e) => setTargetKeywords(e.target.value)}
                          placeholder="keyword1, keyword2, keyword3"
                          disabled={status === "streaming"}
                        />
                      </div>

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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={ctaId}>Call to Action</Label>
                        <Input
                          id={ctaId}
                          value={callToAction}
                          onChange={(e) => setCallToAction(e.target.value)}
                          placeholder="Learn more, Get started, Download now..."
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description Length</Label>
                        <Select value={length} onValueChange={setLength}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">
                              Short (120-140 characters)
                            </SelectItem>
                            <SelectItem value="standard">
                              Standard (150-160 characters)
                            </SelectItem>
                            <SelectItem value="long">
                              Long (160-180 characters)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>SEO Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={includeKeywordsId}
                            checked={includeKeywords}
                            onCheckedChange={(checked) =>
                              setIncludeKeywords(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={includeKeywordsId}
                            className="text-sm font-normal"
                          >
                            Include target keywords in meta description
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          !pageTitle.trim() ||
                          !content.trim() ||
                          status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Meta Descriptions"}
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
                        onClick={regenerateDescriptions}
                        disabled={
                          status === "streaming" ||
                          !pageTitle.trim() ||
                          !content.trim() ||
                          !result
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
                        Generated Meta Descriptions
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
                      <Response>{result}</Response>
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
                            ? "Analyzing content and keywords..."
                            : "Generating SEO-optimized meta descriptions..."}
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
