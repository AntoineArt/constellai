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

export default function TypographyPairerPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.TYPOGRAPHY_PAIRER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const projectTypeId = useId();
  const brandPersonalityId = useId();
  const targetAudienceId = useId();
  const webFontsId = useId();
  const printFontsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [projectType, setProjectType] = useState("website");
  const [brandPersonality, setBrandPersonality] = useState("professional");
  const [targetAudience, setTargetAudience] = useState("");
  const [includeWebFonts, setIncludeWebFonts] = useState(true);
  const [includePrintFonts, setIncludePrintFonts] = useState(false);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const projectTypeRef = useRef<HTMLButtonElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.projectType) {
        setProjectType(execution.inputs.projectType);
      }
      if (execution.inputs?.brandPersonality) {
        setBrandPersonality(execution.inputs.brandPersonality);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.includeWebFonts !== undefined) {
        setIncludeWebFonts(execution.inputs.includeWebFonts);
      }
      if (execution.inputs?.includePrintFonts !== undefined) {
        setIncludePrintFonts(execution.inputs.includePrintFonts);
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
    if (hasApiKey && projectTypeRef.current) {
      projectTypeRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setProjectType("website");
    setBrandPersonality("professional");
    setTargetAudience("");
    setIncludeWebFonts(true);
    setIncludePrintFonts(false);
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
    if (!hasApiKey || status === "submitted" || status === "streaming") return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/typography-pairer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          projectType,
          brandPersonality,
          targetAudience: targetAudience.trim(),
          includeWebFonts,
          includePrintFonts,
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
            projectType,
            brandPersonality,
            targetAudience: targetAudience.trim(),
            includeWebFonts,
            includePrintFonts,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          projectType,
          brandPersonality,
          targetAudience: targetAudience.trim(),
          includeWebFonts,
          includePrintFonts,
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
          "Sorry, an error occurred while generating typography pairings."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    projectType,
    brandPersonality,
    targetAudience,
    includeWebFonts,
    includePrintFonts,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regeneratePairings = useCallback(async () => {
    if (status === "streaming") return;
    await handleSubmit();
  }, [status, handleSubmit]);

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
                projectType: "website",
                brandPersonality: "professional",
                targetAudience: "",
                includeWebFonts: true,
                includePrintFonts: false,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Typography Pairer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Typography Pairer"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate typography pairings
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={projectTypeId}>Project Type</Label>
                        <Select
                          value={projectType}
                          onValueChange={setProjectType}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="mobile-app">
                              Mobile App
                            </SelectItem>
                            <SelectItem value="branding">Branding</SelectItem>
                            <SelectItem value="print">Print Design</SelectItem>
                            <SelectItem value="presentation">
                              Presentation
                            </SelectItem>
                            <SelectItem value="documentation">
                              Documentation
                            </SelectItem>
                            <SelectItem value="ecommerce">
                              E-commerce
                            </SelectItem>
                            <SelectItem value="blog">Blog/Content</SelectItem>
                            <SelectItem value="dashboard">Dashboard</SelectItem>
                            <SelectItem value="landing-page">
                              Landing Page
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={brandPersonalityId}>
                          Brand Personality
                        </Label>
                        <Select
                          value={brandPersonality}
                          onValueChange={setBrandPersonality}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">
                              Professional
                            </SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="traditional">
                              Traditional
                            </SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                            <SelectItem value="minimalist">
                              Minimalist
                            </SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                            <SelectItem value="playful">Playful</SelectItem>
                            <SelectItem value="tech">Tech</SelectItem>
                            <SelectItem value="elegant">Elegant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={targetAudienceId}>
                        Target Audience (Optional)
                      </Label>
                      <Input
                        id={targetAudienceId}
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="Young professionals, parents, students, businesses..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Font Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={webFontsId}
                            checked={includeWebFonts}
                            onCheckedChange={(checked) =>
                              setIncludeWebFonts(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={webFontsId}
                            className="text-sm font-normal"
                          >
                            Include web font alternatives (Google Fonts, etc.)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={printFontsId}
                            checked={includePrintFonts}
                            onCheckedChange={(checked) =>
                              setIncludePrintFonts(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={printFontsId}
                            className="text-sm font-normal"
                          >
                            Include print font alternatives
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={status === "streaming"}>
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Typography Pairings"}
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
                        onClick={regeneratePairings}
                        disabled={status === "streaming" || !result}
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
                        Generated Typography Pairings
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
                    <Response>{result}</Response>
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
                            ? "Analyzing project requirements..."
                            : "Generating typography pairings..."}
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
