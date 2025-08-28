"use client";

import { useCallback, useRef, useState, useEffect, useId } from "react";
import type { ChatStatus } from "ai";

import { TopBar } from "@/components/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

export default function SchemaDesignerPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.SCHEMA_DESIGNER, { apiKey });
  const { preferences } = usePreferences();
  const requirementsId = useId();
  const indexesId = useId();
  const relationshipsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [requirements, setRequirements] = useState("");
  const [databaseType, setDatabaseType] = useState("PostgreSQL");
  const [includeIndexes, setIncludeIndexes] = useState(true);
  const [includeRelationships, setIncludeRelationships] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.requirements) {
        setRequirements(execution.inputs.requirements);
      }
      if (execution.inputs?.databaseType) {
        setDatabaseType(execution.inputs.databaseType);
      }
      if (execution.inputs?.includeIndexes !== undefined) {
        setIncludeIndexes(execution.inputs.includeIndexes);
      }
      if (execution.inputs?.includeRelationships !== undefined) {
        setIncludeRelationships(execution.inputs.includeRelationships);
      }
      if (execution.outputs?.result) {
        setResult(execution.outputs.result);
      }
      if (execution.settings?.selectedModel) {
        setSelectedModel(execution.settings.selectedModel);
      }
    }
  }, [toolHistory.isLoaded, toolHistory.currentExecution]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    }
  });

  // Auto-focus textarea when API key is available
  useEffect(() => {
    if (hasApiKey && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setRequirements("");
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
      !requirements.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/schema-designer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          requirements: requirements.trim(),
          databaseType,
          includeIndexes,
          includeRelationships,
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
            requirements: requirements.trim(),
            databaseType,
            includeIndexes,
            includeRelationships,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          requirements: requirements.trim(),
          databaseType,
          includeIndexes,
          includeRelationships,
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
          "Sorry, an error occurred while generating the database schema."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    requirements,
    databaseType,
    includeIndexes,
    includeRelationships,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateSchema = useCallback(async () => {
    if (status === "streaming" || !requirements.trim()) return;
    await handleSubmit();
  }, [status, requirements, handleSubmit]);

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
                requirements: "",
                databaseType: "PostgreSQL",
                includeIndexes: true,
                includeRelationships: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Schema Designer"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Database Schema Designer"
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
                    design database schemas
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
                      <Label htmlFor={requirementsId}>
                        Database Requirements
                      </Label>
                      <Textarea
                        ref={textareaRef}
                        id={requirementsId}
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        placeholder="Describe your database requirements. For example: 'Design a database for an e-commerce platform with users, products, orders, and reviews'"
                        className="min-h-[150px] max-h-[300px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Database Type</Label>
                        <Select
                          value={databaseType}
                          onValueChange={setDatabaseType}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PostgreSQL">
                              PostgreSQL
                            </SelectItem>
                            <SelectItem value="MySQL">MySQL</SelectItem>
                            <SelectItem value="SQLite">SQLite</SelectItem>
                            <SelectItem value="SQL Server">
                              SQL Server
                            </SelectItem>
                            <SelectItem value="Oracle">Oracle</SelectItem>
                            <SelectItem value="MongoDB">MongoDB</SelectItem>
                            <SelectItem value="Redis">Redis</SelectItem>
                            <SelectItem value="Cassandra">Cassandra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Design Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={indexesId}
                            checked={includeIndexes}
                            onCheckedChange={(checked) =>
                              setIncludeIndexes(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={indexesId}
                            className="text-sm font-normal"
                          >
                            Include performance indexes and optimization
                            suggestions
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={relationshipsId}
                            checked={includeRelationships}
                            onCheckedChange={(checked) =>
                              setIncludeRelationships(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={relationshipsId}
                            className="text-sm font-normal"
                          >
                            Include detailed relationship diagrams and foreign
                            keys
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          !requirements.trim() || status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Designing..."
                          : "Design Schema"}
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
                        onClick={regenerateSchema}
                        disabled={
                          status === "streaming" ||
                          !requirements.trim() ||
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
                        Generated Database Schema
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
                            ? "Analyzing requirements..."
                            : "Designing database schema..."}
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
