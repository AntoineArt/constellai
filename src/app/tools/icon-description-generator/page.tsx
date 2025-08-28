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

export default function IconDescriptionGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.ICON_DESCRIPTION_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const iconPurposeId = useId();
  const styleId = useId();
  const contextId = useId();
  const technicalSpecsId = useId();
  const accessibilityId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [iconPurpose, setIconPurpose] = useState("");
  const [style, setStyle] = useState("modern");
  const [context, setContext] = useState("");
  const [includeTechnicalSpecs, setIncludeTechnicalSpecs] = useState(true);
  const [includeAccessibility, setIncludeAccessibility] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const iconPurposeRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.iconPurpose) {
        setIconPurpose(execution.inputs.iconPurpose);
      }
      if (execution.inputs?.style) {
        setStyle(execution.inputs.style);
      }
      if (execution.inputs?.context) {
        setContext(execution.inputs.context);
      }
      if (execution.inputs?.includeTechnicalSpecs !== undefined) {
        setIncludeTechnicalSpecs(execution.inputs.includeTechnicalSpecs);
      }
      if (execution.inputs?.includeAccessibility !== undefined) {
        setIncludeAccessibility(execution.inputs.includeAccessibility);
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
    if (hasApiKey && iconPurposeRef.current) {
      iconPurposeRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setIconPurpose("");
    setStyle("modern");
    setContext("");
    setIncludeTechnicalSpecs(true);
    setIncludeAccessibility(true);
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
      !iconPurpose.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/icon-description-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          iconPurpose: iconPurpose.trim(),
          style,
          context: context.trim(),
          includeTechnicalSpecs,
          includeAccessibility,
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
            iconPurpose: iconPurpose.trim(),
            style,
            context: context.trim(),
            includeTechnicalSpecs,
            includeAccessibility,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          iconPurpose: iconPurpose.trim(),
          style,
          context: context.trim(),
          includeTechnicalSpecs,
          includeAccessibility,
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
          "Sorry, an error occurred while generating icon description."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    iconPurpose,
    style,
    context,
    includeTechnicalSpecs,
    includeAccessibility,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateDescription = useCallback(async () => {
    if (status === "streaming" || !iconPurpose.trim()) return;
    await handleSubmit();
  }, [status, iconPurpose, handleSubmit]);

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
                iconPurpose: "",
                style: "modern",
                context: "",
                includeTechnicalSpecs: true,
                includeAccessibility: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Icon Description Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Icon Description Generator"
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
                    generate icon descriptions
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
                      <Label htmlFor={iconPurposeId}>Icon Purpose *</Label>
                      <Input
                        ref={iconPurposeRef}
                        id={iconPurposeId}
                        value={iconPurpose}
                        onChange={(e) => setIconPurpose(e.target.value)}
                        placeholder="e.g., Settings, Home, Search, User Profile, Download..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={styleId}>Icon Style</Label>
                        <Select value={style} onValueChange={setStyle}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="minimalist">
                              Minimalist
                            </SelectItem>
                            <SelectItem value="outlined">Outlined</SelectItem>
                            <SelectItem value="filled">Filled</SelectItem>
                            <SelectItem value="rounded">Rounded</SelectItem>
                            <SelectItem value="sharp">Sharp</SelectItem>
                            <SelectItem value="hand-drawn">
                              Hand-drawn
                            </SelectItem>
                            <SelectItem value="vintage">Vintage</SelectItem>
                            <SelectItem value="3d">3D</SelectItem>
                            <SelectItem value="flat">Flat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={contextId}>Context (Optional)</Label>
                        <Input
                          id={contextId}
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          placeholder="e.g., Mobile app, Website navigation, Dashboard..."
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Description Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={technicalSpecsId}
                            checked={includeTechnicalSpecs}
                            onCheckedChange={(checked) =>
                              setIncludeTechnicalSpecs(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={technicalSpecsId}
                            className="text-sm font-normal"
                          >
                            Include technical specifications
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={accessibilityId}
                            checked={includeAccessibility}
                            onCheckedChange={(checked) =>
                              setIncludeAccessibility(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={accessibilityId}
                            className="text-sm font-normal"
                          >
                            Include accessibility guidelines
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!iconPurpose.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Icon Description"}
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
                        onClick={regenerateDescription}
                        disabled={
                          status === "streaming" ||
                          !iconPurpose.trim() ||
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
                        Generated Icon Description
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
                            ? "Analyzing icon requirements..."
                            : "Generating icon description..."}
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
