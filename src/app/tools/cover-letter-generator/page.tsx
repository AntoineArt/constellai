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

export default function CoverLetterGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.COVER_LETTER_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const nameId = useId();
  const contactInfoId = useId();
  const companyId = useId();
  const positionId = useId();
  const experienceId = useId();
  const skillsId = useId();
  const motivationId = useId();
  const ctaId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [motivation, setMotivation] = useState("");
  const [tone, setTone] = useState("professional");
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.name) {
        setName(execution.inputs.name);
      }
      if (execution.inputs?.contactInfo) {
        setContactInfo(execution.inputs.contactInfo);
      }
      if (execution.inputs?.company) {
        setCompany(execution.inputs.company);
      }
      if (execution.inputs?.position) {
        setPosition(execution.inputs.position);
      }
      if (execution.inputs?.experience) {
        setExperience(execution.inputs.experience);
      }
      if (execution.inputs?.skills) {
        setSkills(execution.inputs.skills);
      }
      if (execution.inputs?.motivation) {
        setMotivation(execution.inputs.motivation);
      }
      if (execution.inputs?.tone) {
        setTone(execution.inputs.tone);
      }
      if (execution.inputs?.includeCallToAction !== undefined) {
        setIncludeCallToAction(execution.inputs.includeCallToAction);
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
    if (hasApiKey && nameRef.current) {
      nameRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setName("");
    setContactInfo("");
    setCompany("");
    setPosition("");
    setExperience("");
    setSkills("");
    setMotivation("");
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
      !name.trim() ||
      !company.trim() ||
      !position.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/cover-letter-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          name: name.trim(),
          contactInfo: contactInfo.trim(),
          company: company.trim(),
          position: position.trim(),
          experience: experience.trim(),
          skills: skills.trim(),
          motivation: motivation.trim(),
          tone,
          includeCallToAction,
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
            name: name.trim(),
            contactInfo: contactInfo.trim(),
            company: company.trim(),
            position: position.trim(),
            experience: experience.trim(),
            skills: skills.trim(),
            motivation: motivation.trim(),
            tone,
            includeCallToAction,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          name: name.trim(),
          contactInfo: contactInfo.trim(),
          company: company.trim(),
          position: position.trim(),
          experience: experience.trim(),
          skills: skills.trim(),
          motivation: motivation.trim(),
          tone,
          includeCallToAction,
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
          "Sorry, an error occurred while generating the cover letter."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    name,
    contactInfo,
    company,
    position,
    experience,
    skills,
    motivation,
    tone,
    includeCallToAction,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateLetter = useCallback(async () => {
    if (
      status === "streaming" ||
      !name.trim() ||
      !company.trim() ||
      !position.trim()
    )
      return;
    await handleSubmit();
  }, [status, name, company, position, handleSubmit]);

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
                name: "",
                contactInfo: "",
                company: "",
                position: "",
                experience: "",
                skills: "",
                motivation: "",
                tone: "professional",
                includeCallToAction: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Cover Letter Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Cover Letter Generator"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate cover letters
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
                        <Label htmlFor={nameId}>Your Name *</Label>
                        <Input
                          ref={nameRef}
                          id={nameId}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={companyId}>Company Name *</Label>
                        <Input
                          id={companyId}
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="TechCorp Inc."
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={positionId}>Position Title *</Label>
                      <Input
                        id={positionId}
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="Senior Software Engineer"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={contactInfoId}>Contact Information</Label>
                      <Textarea
                        id={contactInfoId}
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="Email, phone, LinkedIn, address..."
                        className="min-h-[60px] max-h-[100px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={experienceId}>Relevant Experience</Label>
                      <Textarea
                        id={experienceId}
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder="Describe your relevant work experience, achievements, and qualifications..."
                        className="min-h-[100px] max-h-[200px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={skillsId}>Key Skills</Label>
                        <Textarea
                          id={skillsId}
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="Technical skills, soft skills, certifications..."
                          className="min-h-[80px] max-h-[150px] resize-none"
                          disabled={status === "streaming"}
                        />
                      </div>

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
                            <SelectItem value="enthusiastic">
                              Enthusiastic
                            </SelectItem>
                            <SelectItem value="confident">Confident</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={motivationId}>
                        Motivation & Interest
                      </Label>
                      <Textarea
                        id={motivationId}
                        value={motivation}
                        onChange={(e) => setMotivation(e.target.value)}
                        placeholder="Why you're interested in this company/position, what excites you about the role..."
                        className="min-h-[80px] max-h-[150px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Cover Letter Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={ctaId}
                            checked={includeCallToAction}
                            onCheckedChange={(checked) =>
                              setIncludeCallToAction(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={ctaId}
                            className="text-sm font-normal"
                          >
                            Include call-to-action and follow-up request
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          !name.trim() ||
                          !company.trim() ||
                          !position.trim() ||
                          status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Cover Letter"}
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
                        onClick={regenerateLetter}
                        disabled={
                          status === "streaming" ||
                          !name.trim() ||
                          !company.trim() ||
                          !position.trim() ||
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
                        Generated Cover Letter
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
                            ? "Analyzing experience and company details..."
                            : "Generating personalized cover letter..."}
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
