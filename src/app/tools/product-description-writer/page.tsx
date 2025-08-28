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

export default function ProductDescriptionWriterPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.PRODUCT_DESCRIPTION_WRITER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const productNameId = useId();
  const categoryId = useId();
  const featuresId = useId();
  const audienceId = useId();
  const benefitsId = useId();
  const specsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [features, setFeatures] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [platform, setPlatform] = useState("general");
  const [includeBenefits, setIncludeBenefits] = useState(true);
  const [includeSpecs, setIncludeSpecs] = useState(false);
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
      if (execution.inputs?.category) {
        setCategory(execution.inputs.category);
      }
      if (execution.inputs?.features) {
        setFeatures(execution.inputs.features);
      }
      if (execution.inputs?.targetAudience) {
        setTargetAudience(execution.inputs.targetAudience);
      }
      if (execution.inputs?.tone) {
        setTone(execution.inputs.tone);
      }
      if (execution.inputs?.platform) {
        setPlatform(execution.inputs.platform);
      }
      if (execution.inputs?.includeBenefits !== undefined) {
        setIncludeBenefits(execution.inputs.includeBenefits);
      }
      if (execution.inputs?.includeSpecs !== undefined) {
        setIncludeSpecs(execution.inputs.includeSpecs);
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
    setCategory("");
    setFeatures("");
    setTargetAudience("");
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
      !productName.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/product-description-writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          productName: productName.trim(),
          category: category.trim(),
          features: features.trim(),
          targetAudience: targetAudience.trim(),
          tone,
          platform,
          includeBenefits,
          includeSpecs,
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
            category: category.trim(),
            features: features.trim(),
            targetAudience: targetAudience.trim(),
            tone,
            platform,
            includeBenefits,
            includeSpecs,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          productName: productName.trim(),
          category: category.trim(),
          features: features.trim(),
          targetAudience: targetAudience.trim(),
          tone,
          platform,
          includeBenefits,
          includeSpecs,
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
          "Sorry, an error occurred while generating the product description."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    productName,
    category,
    features,
    targetAudience,
    tone,
    platform,
    includeBenefits,
    includeSpecs,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateDescription = useCallback(async () => {
    if (status === "streaming" || !productName.trim()) return;
    await handleSubmit();
  }, [status, productName, handleSubmit]);

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
                category: "",
                features: "",
                targetAudience: "",
                tone: "professional",
                platform: "general",
                includeBenefits: true,
                includeSpecs: false,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Product Description Writer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Product Description Writer"
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
                    generate product descriptions
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
                      <Label htmlFor={productNameId}>Product Name *</Label>
                      <Input
                        ref={productNameRef}
                        id={productNameId}
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., UltraBoost Wireless Headphones..."
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={categoryId}>Product Category</Label>
                        <Input
                          id={categoryId}
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="e.g., Electronics, Home & Garden..."
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={audienceId}>Target Audience</Label>
                        <Input
                          id={audienceId}
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="e.g., Tech enthusiasts, Fitness professionals..."
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectItem value="luxury">Luxury</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="playful">Playful</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Platform</Label>
                        <Select value={platform} onValueChange={setPlatform}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">
                              General E-commerce
                            </SelectItem>
                            <SelectItem value="amazon">Amazon</SelectItem>
                            <SelectItem value="shopify">Shopify</SelectItem>
                            <SelectItem value="etsy">Etsy</SelectItem>
                            <SelectItem value="ebay">eBay</SelectItem>
                            <SelectItem value="social">Social Media</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={featuresId}>Product Features</Label>
                      <Textarea
                        id={featuresId}
                        value={features}
                        onChange={(e) => setFeatures(e.target.value)}
                        placeholder="List the key features, specifications, and benefits of your product..."
                        className="min-h-[100px] max-h-[200px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Description Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={benefitsId}
                            checked={includeBenefits}
                            onCheckedChange={(checked) =>
                              setIncludeBenefits(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={benefitsId}
                            className="text-sm font-normal"
                          >
                            Emphasize benefits and value proposition
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={specsId}
                            checked={includeSpecs}
                            onCheckedChange={(checked) =>
                              setIncludeSpecs(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={specsId}
                            className="text-sm font-normal"
                          >
                            Include detailed specifications
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!productName.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Product Description"}
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
                          !productName.trim() ||
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
                        Generated Product Description
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
                            ? "Analyzing product details..."
                            : "Generating product description..."}
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
