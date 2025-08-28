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

export default function LogoConceptGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.LOGO_CONCEPT_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const brandNameId = useId();
  const industryId = useId();
  const targetAudienceId = useId();
  const typographyId = useId();
  const colorsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [style, setStyle] = useState("modern");
  const [includeTypography, setIncludeTypography] = useState(true);
  const [includeColorSuggestions, setIncludeColorSuggestions] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const brandNameRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.brandName) {
        setBrandName(execution.inputs.brandName);
      }
      if (execution.inputs?.industry) {
        setIndustry(execution.inputs.industry);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.style) {
        setStyle(execution.inputs.style);
      }
      if (execution.inputs?.includeTypography !== undefined) {
        setIncludeTypography(execution.inputs.includeTypography);
      }
      if (execution.inputs?.includeColorSuggestions !== undefined) {
        setIncludeColorSuggestions(execution.inputs.includeColorSuggestions);
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
    if (hasApiKey && brandNameRef.current) {
      brandNameRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setBrandName("");
    setIndustry("");
    setTargetAudience("");
    setStyle("modern");
    setIncludeTypography(true);
    setIncludeColorSuggestions(true);
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
      !brandName.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/logo-concept-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          brandName: brandName.trim(),
          industry: industry.trim(),
          targetAudience: targetAudience.trim(),
          style,
          includeTypography,
          includeColorSuggestions,
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
            brandName: brandName.trim(),
            industry: industry.trim(),
            targetAudience: targetAudience.trim(),
            style,
            includeTypography,
            includeColorSuggestions,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          brandName: brandName.trim(),
          industry: industry.trim(),
          targetAudience: targetAudience.trim(),
          style,
          includeTypography,
          includeColorSuggestions,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating logo concepts.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    brandName,
    industry,
    targetAudience,
    style,
    includeTypography,
    includeColorSuggestions,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateConcepts = useCallback(async () => {
    if (status === "streaming" || !brandName.trim()) return;
    await handleSubmit();
  }, [status, brandName, handleSubmit]);

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
                brandName: "",
                industry: "",
                targetAudience: "",
                style: "modern",
                includeTypography: true,
                includeColorSuggestions: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Logo Concept Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Logo Concept Generator"
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
                    generate logo concepts
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
                      <Label htmlFor={brandNameId}>Brand Name *</Label>
                      <Input
                        ref={brandNameRef}
                        id={brandNameId}
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Your Brand Name"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={industryId}>Industry</Label>
                        <Input
                          id={industryId}
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="Technology, Healthcare, Finance..."
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
                          placeholder="Young professionals, parents, students..."
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Design Style</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="minimalist">Minimalist</SelectItem>
                          <SelectItem value="playful">Playful</SelectItem>
                          <SelectItem value="professional">
                            Professional
                          </SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                          <SelectItem value="elegant">Elegant</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="vintage">Vintage</SelectItem>
                          <SelectItem value="tech">Tech</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Logo Concept Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={typographyId}
                            checked={includeTypography}
                            onCheckedChange={(checked) =>
                              setIncludeTypography(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={typographyId}
                            className="text-sm font-normal"
                          >
                            Include typography recommendations
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={colorsId}
                            checked={includeColorSuggestions}
                            onCheckedChange={(checked) =>
                              setIncludeColorSuggestions(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={colorsId}
                            className="text-sm font-normal"
                          >
                            Include color palette suggestions
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!brandName.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Logo Concepts"}
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
                        onClick={regenerateConcepts}
                        disabled={
                          status === "streaming" || !brandName.trim() || !result
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
                        Generated Logo Concepts
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
                            ? "Analyzing brand requirements..."
                            : "Generating logo concept ideas..."}
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
