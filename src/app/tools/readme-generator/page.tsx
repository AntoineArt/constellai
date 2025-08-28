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

const README_SECTIONS = [
  { id: "features", label: "Features & Capabilities" },
  { id: "installation", label: "Installation Instructions" },
  { id: "usage", label: "Usage Examples" },
  { id: "api", label: "API Documentation" },
  { id: "configuration", label: "Configuration Options" },
  { id: "contributing", label: "Contributing Guidelines" },
  { id: "license", label: "License Information" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "changelog", label: "Changelog" },
  { id: "examples", label: "Code Examples" },
];

export default function ReadmeGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.README_GENERATOR, { apiKey });
  const { preferences } = usePreferences();
  const projectNameId = useId();
  const descriptionId = useId();
  const codeId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [format, setFormat] = useState("Markdown");
  const [selectedSections, setSelectedSections] = useState<string[]>([
    "features",
    "installation",
    "usage",
    "api",
    "configuration",
  ]);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.projectName) {
        setProjectName(execution.inputs.projectName);
      }
      if (execution.inputs?.description) {
        setDescription(execution.inputs.description);
      }
      if (execution.inputs?.code) {
        setCode(execution.inputs.code);
      }
      if (execution.inputs?.format) {
        setFormat(execution.inputs.format);
      }
      if (execution.inputs?.includeSections) {
        setSelectedSections(execution.inputs.includeSections);
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
    const textarea = descriptionTextareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  });

  // Auto-focus textarea when API key is available
  useEffect(() => {
    if (hasApiKey && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setProjectName("");
    setDescription("");
    setCode("");
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

  const toggleSection = useCallback((sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (
      !hasApiKey ||
      status === "submitted" ||
      status === "streaming" ||
      (!projectName.trim() && !description.trim() && !code.trim())
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/readme-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          projectName: projectName.trim(),
          description: description.trim(),
          code: code.trim(),
          format,
          includeSections: selectedSections,
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
            projectName: projectName.trim(),
            description: description.trim(),
            code: code.trim(),
            format,
            includeSections: selectedSections,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          projectName: projectName.trim(),
          description: description.trim(),
          code: code.trim(),
          format,
          includeSections: selectedSections,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating the README.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    projectName,
    description,
    code,
    format,
    selectedSections,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateReadme = useCallback(async () => {
    if (
      status === "streaming" ||
      (!projectName.trim() && !description.trim() && !code.trim())
    )
      return;
    await handleSubmit();
  }, [status, projectName, description, code, handleSubmit]);

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
                projectName: "",
                description: "",
                code: "",
                format: "Markdown",
                includeSections: [
                  "features",
                  "installation",
                  "usage",
                  "api",
                  "configuration",
                ],
              },
              { selectedModel }
            );
          }
        }}
        toolName="README Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="README Generator"
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
                    generate README files
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
                        <Label htmlFor={projectNameId}>Project Name</Label>
                        <Input
                          id={projectNameId}
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="Enter your project name..."
                          disabled={status === "streaming"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select value={format} onValueChange={setFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Markdown">Markdown</SelectItem>
                            <SelectItem value="RST">
                              reStructuredText
                            </SelectItem>
                            <SelectItem value="AsciiDoc">AsciiDoc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={descriptionId}>Project Description</Label>
                      <Textarea
                        ref={descriptionTextareaRef}
                        id={descriptionId}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your project, its purpose, and key features..."
                        className="min-h-[100px] max-h-[200px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={codeId}>
                        Code/Project Structure (Optional)
                      </Label>
                      <Textarea
                        id={codeId}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste your code, project structure, or key files to help generate more accurate documentation..."
                        className="min-h-[150px] max-h-[300px] resize-none font-mono text-sm"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Include Sections</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {README_SECTIONS.map((section) => (
                          <div
                            key={section.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={section.id}
                              checked={selectedSections.includes(section.id)}
                              onCheckedChange={() => toggleSection(section.id)}
                              disabled={status === "streaming"}
                            />
                            <Label
                              htmlFor={section.id}
                              className="text-sm font-normal"
                            >
                              {section.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          (!projectName.trim() &&
                            !description.trim() &&
                            !code.trim()) ||
                          status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate README"}
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
                        onClick={regenerateReadme}
                        disabled={
                          status === "streaming" ||
                          (!projectName.trim() &&
                            !description.trim() &&
                            !code.trim()) ||
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
                        Generated README
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
                            ? "Analyzing project information..."
                            : "Generating README..."}
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
