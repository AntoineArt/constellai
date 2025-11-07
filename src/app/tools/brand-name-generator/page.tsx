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

export default function BrandNameGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.BRAND_NAME_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const industryId = useId();
  const targetAudienceId = useId();
  const brandPersonalityId = useId();
  const nameStyleId = useId();
  const domainCheckId = useId();
  const trademarkCheckId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandPersonality, setBrandPersonality] = useState("professional");
  const [nameStyle, setNameStyle] = useState("modern");
  const [includeDomainCheck, setIncludeDomainCheck] = useState(true);
  const [includeTrademarkCheck, setIncludeTrademarkCheck] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const industryRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.industry) {
        setIndustry(execution.inputs.industry);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.brandPersonality) {
        setBrandPersonality(execution.inputs.brandPersonality);
      }
      if (execution.inputs?.nameStyle) {
        setNameStyle(execution.inputs.nameStyle);
      }
      if (execution.inputs?.includeDomainCheck !== undefined) {
        setIncludeDomainCheck(execution.inputs.includeDomainCheck);
      }
      if (execution.inputs?.includeTrademarkCheck !== undefined) {
        setIncludeTrademarkCheck(execution.inputs.includeTrademarkCheck);
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
    if (hasApiKey && industryRef.current) {
      industryRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setIndustry("");
    setTargetAudience("");
    setBrandPersonality("professional");
    setNameStyle("modern");
    setIncludeDomainCheck(true);
    setIncludeTrademarkCheck(true);
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
      !industry.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/brand-name-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          industry: industry.trim(),
          targetAudience: targetAudience.trim(),
          brandPersonality,
          nameStyle,
          includeDomainCheck,
          includeTrademarkCheck,
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
            industry: industry.trim(),
            targetAudience: targetAudience.trim(),
            brandPersonality,
            nameStyle,
            includeDomainCheck,
            includeTrademarkCheck,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          industry: industry.trim(),
          targetAudience: targetAudience.trim(),
          brandPersonality,
          nameStyle,
          includeDomainCheck,
          includeTrademarkCheck,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating brand names.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    industry,
    targetAudience,
    brandPersonality,
    nameStyle,
    includeDomainCheck,
    includeTrademarkCheck,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateNames = useCallback(async () => {
    if (status === "streaming" || !industry.trim()) return;
    await handleSubmit();
  }, [status, industry, handleSubmit]);

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
                industry: "",
                targetAudience: "",
                brandPersonality: "professional",
                nameStyle: "modern",
                includeDomainCheck: true,
                includeTrademarkCheck: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Brand Name Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Brand Name Generator"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate brand names
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
                      <Label htmlFor={industryId}>Industry *</Label>
                      <Input
                        ref={industryRef}
                        id={industryId}
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="Technology, Healthcare, Finance, Food & Beverage..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={targetAudienceId}>Target Audience</Label>
                      <Input
                        id={targetAudienceId}
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="Young professionals, parents, students, businesses..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectItem value="innovative">
                              Innovative
                            </SelectItem>
                            <SelectItem value="trustworthy">
                              Trustworthy
                            </SelectItem>
                            <SelectItem value="playful">Playful</SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                            <SelectItem value="minimalist">
                              Minimalist
                            </SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                            <SelectItem value="traditional">
                              Traditional
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={nameStyleId}>Name Style</Label>
                        <Select value={nameStyle} onValueChange={setNameStyle}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="descriptive">
                              Descriptive
                            </SelectItem>
                            <SelectItem value="abstract">Abstract</SelectItem>
                            <SelectItem value="compound">
                              Compound Words
                            </SelectItem>
                            <SelectItem value="invented">
                              Invented Words
                            </SelectItem>
                            <SelectItem value="foreign">
                              Foreign Words
                            </SelectItem>
                            <SelectItem value="acronym">Acronym</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Brand Name Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={domainCheckId}
                            checked={includeDomainCheck}
                            onCheckedChange={(checked) =>
                              setIncludeDomainCheck(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={domainCheckId}
                            className="text-sm font-normal"
                          >
                            Include domain availability suggestions
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={trademarkCheckId}
                            checked={includeTrademarkCheck}
                            onCheckedChange={(checked) =>
                              setIncludeTrademarkCheck(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={trademarkCheckId}
                            className="text-sm font-normal"
                          >
                            Include trademark considerations
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!industry.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Brand Names"}
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
                        onClick={regenerateNames}
                        disabled={
                          status === "streaming" || !industry.trim() || !result
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
                        Generated Brand Names
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
                            ? "Analyzing industry and requirements..."
                            : "Generating brand name suggestions..."}
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
