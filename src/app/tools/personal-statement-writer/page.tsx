"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ai-elements/loader";
import { Message } from "@/components/ai-elements/message";
import { useApiKey } from "@/hooks/use-api-key";
import { useToolHistory } from "@/lib/storage/hooks/use-tool-history";
import { usePreferences } from "@/lib/storage/hooks/use-preferences";
import { ToolHistorySidebar } from "@/components/tool-history-sidebar";
import { FileText, Target, User, Award } from "lucide-react";

export default function PersonalStatementWriterPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("personal-statement-writer");
  const [purpose, setPurpose] = useState("");
  const [program, setProgram] = useState("");
  const [background, setBackground] = useState("");
  const [experiences, setExperiences] = useState("");
  const [goals, setGoals] = useState("");
  const [challenges, setChallenges] = useState("");
  const [wordLimit, setWordLimit] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/personal-statement-writer",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { purpose, program, background, experiences, goals, challenges, wordLimit },
        outputs: { statement: message.content },
      });
    },
    onError: (error) => {
      console.error("Personal statement writer error:", error);
    },
  });

  const handleGenerate = () => {
    if (!purpose.trim() || !program.trim() || !background.trim() || !experiences.trim() || !goals.trim()) return;

    const newInputs = { purpose, program, background, experiences, goals, challenges, wordLimit };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        purpose: purpose.trim(),
        program: program.trim(),
        background: background.trim(),
        experiences: experiences.trim(),
        goals: goals.trim(),
        challenges: challenges.trim(),
        wordLimit: wordLimit.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setPurpose("");
    setProgram("");
    setBackground("");
    setExperiences("");
    setGoals("");
    setChallenges("");
    setWordLimit("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setPurpose(execution.inputs?.purpose || "");
    setProgram(execution.inputs?.program || "");
    setBackground(execution.inputs?.background || "");
    setExperiences(execution.inputs?.experiences || "");
    setGoals(execution.inputs?.goals || "");
    setChallenges(execution.inputs?.challenges || "");
    setWordLimit(execution.inputs?.wordLimit || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="personal-statement-writer"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Personal Statement Writer</h1>
              <p className="text-muted-foreground">
                Create compelling personal statements for applications and opportunities
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="college-admission">College Admission</SelectItem>
                      <SelectItem value="graduate-school">Graduate School</SelectItem>
                      <SelectItem value="medical-school">Medical School</SelectItem>
                      <SelectItem value="law-school">Law School</SelectItem>
                      <SelectItem value="business-school">Business School (MBA)</SelectItem>
                      <SelectItem value="scholarship">Scholarship Application</SelectItem>
                      <SelectItem value="job-application">Job Application</SelectItem>
                      <SelectItem value="fellowship">Fellowship/Grant</SelectItem>
                      <SelectItem value="residency">Residency Program</SelectItem>
                      <SelectItem value="internship">Internship Program</SelectItem>
                      <SelectItem value="study-abroad">Study Abroad Program</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="program">Program/Position *</Label>
                  <Input
                    id="program"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="e.g., Master's in Computer Science, Marketing Manager"
                  />
                </div>
                <div>
                  <Label htmlFor="wordLimit">Word/Character Limit (Optional)</Label>
                  <Input
                    id="wordLimit"
                    value={wordLimit}
                    onChange={(e) => setWordLimit(e.target.value)}
                    placeholder="e.g., 500 words, 2000 characters"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Background
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="background"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="Describe your educational background, current status, and relevant personal context..."
                  rows={5}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Key Experiences *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="experiences"
                value={experiences}
                onChange={(e) => setExperiences(e.target.value)}
                placeholder="Describe your most relevant experiences, achievements, projects, or activities that demonstrate your qualifications..."
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Career Goals *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="goals"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="What are your career aspirations and how does this opportunity fit into your plans?"
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Challenges Overcome (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="challenges"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="Any significant challenges or obstacles you've overcome that shaped your character or perspective..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !purpose.trim() || !program.trim() || !background.trim() || !experiences.trim() || !goals.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Writing Statement...
                </>
              ) : (
                "Generate Personal Statement"
              )}
            </Button>
            {isLoading && (
              <Button variant="outline" onClick={stop}>
                Stop
              </Button>
            )}
            <Button variant="outline" onClick={clearForm}>
              Clear
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">
                Error: {error.message}. Please try again.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </div>

          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in your details above to create a compelling personal statement.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}