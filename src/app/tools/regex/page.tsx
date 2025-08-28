"use client";

import { useState, useEffect, useMemo } from "react";
import { Zap, Copy, CheckCircle2, Play } from "lucide-react";

import { TopBar } from "@/components/top-bar";
import { ToolHistorySidebar } from "@/components/tool-history-sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiKey } from "@/hooks/use-api-key";
import { useToolHistory, usePreferences, TOOL_IDS } from "@/lib/storage";

export default function RegexPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.REGEX, { apiKey });
  const { preferences } = usePreferences();

  const [description, setDescription] = useState("");
  const [testText, setTestText] = useState("");
  const [generatedRegex, setGeneratedRegex] = useState({
    javascript: "",
    pcre: "",
    explanation: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs) {
        setDescription(execution.inputs.description || "");
        setTestText(execution.inputs.testText || "");
      }
      if (execution.outputs) {
        setGeneratedRegex({
          javascript: execution.outputs.javascript || "",
          pcre: execution.outputs.pcre || "",
          explanation: execution.outputs.explanation || "",
        });
        if (execution.outputs.matches) {
          setMatches(execution.outputs.matches);
        }
      }
      if (execution.settings?.selectedModel) {
        setSelectedModel(execution.settings.selectedModel);
      }
    }
  }, [toolHistory.isLoaded, toolHistory.currentExecution]);

  // Debounced auto-save inputs when they change
  const debouncedInputs = useMemo(
    () => ({ description, testText }),
    [description, testText]
  );

  useEffect(() => {
    if (!toolHistory.isLoaded || (!description && !testText)) return;

    const timeoutId = setTimeout(async () => {
      if (!toolHistory.currentExecution) {
        await toolHistory.createNewExecution(debouncedInputs, {
          selectedModel,
        });
      } else {
        toolHistory.updateCurrentExecution({
          inputs: debouncedInputs,
          settings: { selectedModel },
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [debouncedInputs.description, debouncedInputs.testText, selectedModel]);

  const handleGenerate = async () => {
    if (!description.trim() || !hasApiKey) return;

    setIsGenerating(true);

    try {
      const response = await fetch("/api/regex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          description,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate regex");
      }

      const result = await response.json();
      setGeneratedRegex(result);

      // Test against sample text if provided
      let matchResults: string[] = [];
      if (testText && result.javascript) {
        matchResults = testRegex(result.javascript, testText);
      }

      // Save outputs to storage
      toolHistory.updateCurrentExecution({
        outputs: {
          javascript: result.javascript,
          pcre: result.pcre,
          explanation: result.explanation,
          matches: matchResults,
        },
      });
    } catch (error) {
      console.error("Error generating regex:", error);
      setGeneratedRegex({
        javascript: "",
        pcre: "",
        explanation:
          "Failed to generate regex. Please check your API key and try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const testRegex = (pattern: string, text: string): string[] => {
    try {
      const regex = new RegExp(pattern.slice(1, -2), pattern.slice(-2, -1));
      const foundMatches = text.match(regex) || [];
      setMatches(foundMatches);
      return foundMatches;
    } catch (error) {
      setMatches([]);
      return [];
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const toolActions = (
    <Button
      onClick={handleGenerate}
      disabled={!description.trim() || !hasApiKey || isGenerating}
    >
      <Zap className="h-4 w-4" />
      {isGenerating ? "Generating..." : "Generate"}
    </Button>
  );

  const clearRegex = () => {
    setDescription("");
    setTestText("");
    setGeneratedRegex({ javascript: "", pcre: "", explanation: "" });
    setMatches([]);
    toolHistory.clearActiveExecution();
  };

  const createNewRegex = async () => {
    clearRegex();
    await toolHistory.createNewExecution(
      { description: "", testText: "" },
      { selectedModel }
    );
  };

  return (
    <div className="h-screen overflow-hidden flex">
      {/* Tool History Sidebar */}
      <ToolHistorySidebar
        executions={toolHistory.executions}
        activeExecutionId={toolHistory.activeExecutionId}
        onSelectExecution={toolHistory.switchToExecution}
        onDeleteExecution={toolHistory.deleteExecution}
        onRenameExecution={toolHistory.renameExecution}
        onNewExecution={createNewRegex}
        toolName="Regex Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Regex Generator"
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />

        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Input Section */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Describe Your Pattern</CardTitle>
                    <CardDescription>
                      Explain in natural language what you want to match
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!hasApiKey ? (
                      <div className="rounded-lg border border-muted bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground">
                          Please set your Vercel AI Gateway API key in the top
                          bar to generate regex patterns
                        </p>
                      </div>
                    ) : (
                      <>
                        <Textarea
                          placeholder="e.g., 'Match all email addresses' or 'Find phone numbers in the format (123) 456-7890'"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <Button
                          onClick={handleGenerate}
                          disabled={!description.trim() || isGenerating}
                          className="w-full"
                        >
                          <Zap className="h-4 w-4" />
                          {isGenerating ? "Generating..." : "Generate Regex"}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Test Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Test Your Regex</CardTitle>
                    <CardDescription>
                      Paste sample text to test the generated pattern
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Paste your test text here..."
                      value={testText}
                      onChange={(e) => {
                        setTestText(e.target.value);
                        if (generatedRegex.javascript) {
                          testRegex(generatedRegex.javascript, e.target.value);
                        }
                      }}
                      className="min-h-[100px]"
                    />
                    {matches.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                          Matches Found ({matches.length}):
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {matches.map((match, index) => (
                            <Badge key={index} variant="secondary">
                              {match}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Results Section */}
              <div className="space-y-4">
                {generatedRegex.javascript && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Generated Patterns</CardTitle>
                      <CardDescription>
                        Your regex patterns in different formats
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="javascript" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="javascript">
                            JavaScript
                          </TabsTrigger>
                          <TabsTrigger value="pcre">PCRE</TabsTrigger>
                        </TabsList>
                        <TabsContent value="javascript" className="space-y-4">
                          <div className="relative">
                            <Input
                              value={generatedRegex.javascript}
                              readOnly
                              className="pr-10 font-mono"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute right-1 top-1 h-7 w-7 p-0"
                              onClick={() =>
                                copyToClipboard(generatedRegex.javascript, "js")
                              }
                            >
                              {copied === "js" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="rounded-lg bg-muted p-4">
                            <h4 className="text-sm font-medium mb-2">
                              JavaScript Code:
                            </h4>
                            <code className="text-sm">
                              const regex = {generatedRegex.javascript};{"\n"}
                              const matches = text.match(regex);
                            </code>
                          </div>
                        </TabsContent>
                        <TabsContent value="pcre" className="space-y-4">
                          <div className="relative">
                            <Input
                              value={generatedRegex.pcre}
                              readOnly
                              className="pr-10 font-mono"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute right-1 top-1 h-7 w-7 p-0"
                              onClick={() =>
                                copyToClipboard(generatedRegex.pcre, "pcre")
                              }
                            >
                              {copied === "pcre" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="rounded-lg bg-muted p-4">
                            <h4 className="text-sm font-medium mb-2">
                              Python Code:
                            </h4>
                            <code className="text-sm">
                              import re{"\n"}
                              pattern = r"{generatedRegex.pcre}"{"\n"}
                              matches = re.findall(pattern, text)
                            </code>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}

                {generatedRegex.explanation && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Explanation</CardTitle>
                      <CardDescription>
                        How this regex pattern works
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">
                        {generatedRegex.explanation}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {isGenerating && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Generating your regex pattern...
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
