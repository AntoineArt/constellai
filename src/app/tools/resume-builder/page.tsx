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

export default function ResumeBuilderPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.RESUME_BUILDER, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const nameId = useId();
  const contactInfoId = useId();
  const summaryId = useId();
  const experienceId = useId();
  const educationId = useId();
  const skillsId = useId();
  const targetJobId = useId();
  const keywordsId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [targetJob, setTargetJob] = useState("");
  const [format, setFormat] = useState("professional");
  const [includeKeywords, setIncludeKeywords] = useState(true);
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
      if (execution.inputs?.summary) {
        setSummary(execution.inputs.summary);
      }
      if (execution.inputs?.experience) {
        setExperience(execution.inputs.experience);
      }
      if (execution.inputs?.education) {
        setEducation(execution.inputs.education);
      }
      if (execution.inputs?.skills) {
        setSkills(execution.inputs.skills);
      }
      if (execution.inputs?.targetJob) {
        setTargetJob(execution.inputs.targetJob);
      }
      if (execution.inputs?.format) {
        setFormat(execution.inputs.format);
      }
      if (execution.inputs?.includeKeywords !== undefined) {
        setIncludeKeywords(execution.inputs.includeKeywords);
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
    setSummary("");
    setExperience("");
    setEducation("");
    setSkills("");
    setTargetJob("");
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
      !name.trim()
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/resume-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          name: name.trim(),
          contactInfo: contactInfo.trim(),
          summary: summary.trim(),
          experience: experience.trim(),
          education: education.trim(),
          skills: skills.trim(),
          targetJob: targetJob.trim(),
          format,
          includeKeywords,
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
            summary: summary.trim(),
            experience: experience.trim(),
            education: education.trim(),
            skills: skills.trim(),
            targetJob: targetJob.trim(),
            format,
            includeKeywords,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          name: name.trim(),
          contactInfo: contactInfo.trim(),
          summary: summary.trim(),
          experience: experience.trim(),
          education: education.trim(),
          skills: skills.trim(),
          targetJob: targetJob.trim(),
          format,
          includeKeywords,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult("Sorry, an error occurred while generating the resume.");
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    name,
    contactInfo,
    summary,
    experience,
    education,
    skills,
    targetJob,
    format,
    includeKeywords,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateResume = useCallback(async () => {
    if (status === "streaming" || !name.trim()) return;
    await handleSubmit();
  }, [status, name, handleSubmit]);

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
                summary: "",
                experience: "",
                education: "",
                skills: "",
                targetJob: "",
                format: "professional",
                includeKeywords: true,
              },
              { selectedModel }
            );
          }
        }}
        toolName="Resume Builder"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Resume Builder"
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate resumes
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
                        <Label htmlFor={nameId}>Full Name *</Label>
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
                        <Label htmlFor={targetJobId}>Target Job Position</Label>
                        <Input
                          id={targetJobId}
                          value={targetJob}
                          onChange={(e) => setTargetJob(e.target.value)}
                          placeholder="e.g., Senior Software Engineer"
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={contactInfoId}>Contact Information</Label>
                      <Textarea
                        id={contactInfoId}
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="Email, phone, LinkedIn, location..."
                        className="min-h-[60px] max-h-[100px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={summaryId}>Professional Summary</Label>
                      <Textarea
                        id={summaryId}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Brief professional summary or career objective..."
                        className="min-h-[80px] max-h-[150px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={experienceId}>Work Experience</Label>
                      <Textarea
                        id={experienceId}
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder="List your work experience with company names, positions, dates, and key achievements..."
                        className="min-h-[120px] max-h-[200px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={educationId}>Education</Label>
                        <Textarea
                          id={educationId}
                          value={education}
                          onChange={(e) => setEducation(e.target.value)}
                          placeholder="Degrees, certifications, institutions, dates..."
                          className="min-h-[80px] max-h-[150px] resize-none"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={skillsId}>Skills</Label>
                        <Textarea
                          id={skillsId}
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="Technical skills, soft skills, languages, tools..."
                          className="min-h-[80px] max-h-[150px] resize-none"
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Resume Format</Label>
                        <Select value={format} onValueChange={setFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">
                              Professional
                            </SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                            <SelectItem value="minimalist">
                              Minimalist
                            </SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Resume Options</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={keywordsId}
                            checked={includeKeywords}
                            onCheckedChange={(checked) =>
                              setIncludeKeywords(checked as boolean)
                            }
                            disabled={status === "streaming"}
                          />
                          <Label
                            htmlFor={keywordsId}
                            className="text-sm font-normal"
                          >
                            Include ATS-optimized keywords
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!name.trim() || status === "streaming"}
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Resume"}
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
                        onClick={regenerateResume}
                        disabled={
                          status === "streaming" || !name.trim() || !result
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
                        Generated Resume
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
                            ? "Analyzing experience and skills..."
                            : "Generating professional resume..."}
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
