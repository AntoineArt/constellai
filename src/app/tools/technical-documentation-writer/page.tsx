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

export default function TechnicalDocumentationWriterPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.TECHNICAL_DOCUMENTATION_WRITER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const productNameId = useId();
  const productDescriptionId = useId();
  const targetAudienceId = useId();
  const featuresId = useId();
  const screenshotsId = useId();
  const troubleshootingId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [documentationType, setDocumentationType] = useState("user-manual");
  const [features, setFeatures] = useState("");
  const [includeScreenshots, setIncludeScreenshots] = useState(true);
  const [includeTroubleshooting, setIncludeTroubleshooting] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const productNameRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.productName) {
        setProductName(execution.inputs.productName);
      }
      if (execution.inputs?.productDescription) {
        setProductDescription(execution.inputs.productDescription);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.documentationType) {
        setDocumentationType(execution.inputs.documentationType);
      }
      if (execution.inputs?.features) {
        setFeatures(execution.inputs.features);
      }
      if (execution.inputs?.includeScreenshots !== undefined) {
        setIncludeScreenshots(execution.inputs.includeScreenshots);
      }
      if (execution.inputs?.includeTroubleshooting !== undefined) {
        setIncludeTroubleshooting(execution.inputs.includeTroubleshooting);
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
    if (hasApiKey && productNameRef.current) {
      productNameRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setProductName("");
    setProductDescription("");
    setTargetAudience("");
    setDocumentationType("user-manual");
    setFeatures("");
    setIncludeScreenshots(true);
    setIncludeTroubleshooting(true);
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
      !productName.trim() ||
      !productDescription.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/technical-documentation-writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          targetAudience: targetAudience.trim(),
          documentationType,
          features: features.trim(),
          includeScreenshots,
          includeTroubleshooting,
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
            productName: productName.trim(),
            productDescription: productDescription.trim(),
            targetAudience: targetAudience.trim(),
            documentationType,
            features: features.trim(),
            includeScreenshots,
            includeTroubleshooting,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          targetAudience: targetAudience.trim(),
          documentationType,
          features: features.trim(),
          includeScreenshots,
          includeTroubleshooting,
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
          "Sorry, an error occurred while generating the technical documentation."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    productName,
    productDescription,
    targetAudience,
    documentationType,
    features,
    includeScreenshots,
    includeTroubleshooting,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateDocumentation = useCallback(async () => {
    if (
      status === "streaming" ||
      !productName.trim() ||
      !productDescription.trim()
    )
      return;
    await handleSubmit();
  }, [status, productName, productDescription, handleSubmit]);

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
                productName: "",
                productDescription: "",
                targetAudience: "",
                documentationType: "user-manual",
                features: "",
                includeScreenshots: true,
                includeTroubleshooting: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Technical Documentation Writer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Technical Documentation Writer"
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
                    generate technical documentation
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
                        <Label htmlFor={productNameId}>Product Name *</Label>
                        <Input
                          ref={productNameRef}
                          id={productNameId}
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="Product Name"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Documentation Type</Label>
                        <Select
                          value={documentationType}
                          onValueChange={setDocumentationType}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user-manual">
                              User Manual
                            </SelectItem>
                            <SelectItem value="api-docs">
                              API Documentation
                            </SelectItem>
                            <SelectItem value="installation-guide">
                              Installation Guide
                            </SelectItem>
                            <SelectItem value="admin-guide">
                              Administrator Guide
                            </SelectItem>
                            <SelectItem value="developer-guide">
                              Developer Guide
                            </SelectItem>
                            <SelectItem value="troubleshooting-guide">
                              Troubleshooting Guide
                            </SelectItem>
                            <SelectItem value="quick-start">
                              Quick Start Guide
                            </SelectItem>
                            <SelectItem value="reference-manual">
                              Reference Manual
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={productDescriptionId}>
                        Product Description *
                      </Label>
                      <Textarea
                        id={productDescriptionId}
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Describe your product, its purpose, and main functionality..."
                        className="min-h-[100px] max-h-[200px] resize-none"
                        disabled={status === "streaming"}
                      />
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
                          placeholder="End users, developers, administrators..."
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={featuresId}>Key Features</Label>
                        <Textarea
                          id={featuresId}
                          value={features}
                          onChange={(e) => setFeatures(e.target.value)}
                          placeholder="List main features and capabilities..."
                          className="min-h-[80px] max-h-[150px] resize-none"
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Documentation Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={screenshotsId}
                            checked={includeScreenshots}
                            onCheckedChange={(checked) =>
                              setIncludeScreenshots(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={screenshotsId}
                            className="text-sm font-normal"
                          >
                            Include screenshot descriptions and placement
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={troubleshootingId}
                            checked={includeTroubleshooting}
                            onCheckedChange={(checked) =>
                              setIncludeTroubleshooting(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={troubleshootingId}
                            className="text-sm font-normal"
                          >
                            Include troubleshooting section
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          !productName.trim() ||
                          !productDescription.trim() ||
                          status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Documentation"}
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
                        onClick={regenerateDocumentation}
                        disabled={
                          status === "streaming" ||
                          !productName.trim() ||
                          !productDescription.trim() ||
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
                        Generated Technical Documentation
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
                            ? "Analyzing product requirements..."
                            : "Generating comprehensive technical documentation..."}
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
