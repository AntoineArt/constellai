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
import { BookOpen, Target, Heart, Clock } from "lucide-react";

export default function PersonalJournalPromptsPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("personal-journal-prompts");
  const [purpose, setPurpose] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [writingStyle, setWritingStyle] = useState("");
  const [frequency, setFrequency] = useState("");
  const [currentSituation, setCurrentSituation] = useState("");
  const [goals, setGoals] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/personal-journal-prompts",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { purpose, timeframe, focusAreas, writingStyle, frequency, currentSituation, goals },
        outputs: { prompts: message.content },
      });
    },
    onError: (error) => {
      console.error("Personal journal prompts error:", error);
    },
  });

  const handleGenerate = () => {
    if (!purpose.trim() || !focusAreas.trim() || !writingStyle.trim() || !frequency.trim()) return;

    const newInputs = { purpose, timeframe, focusAreas, writingStyle, frequency, currentSituation, goals };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        purpose: purpose.trim(),
        timeframe: timeframe.trim(),
        focusAreas: focusAreas.trim(),
        writingStyle: writingStyle.trim(),
        frequency: frequency.trim(),
        currentSituation: currentSituation.trim(),
        goals: goals.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setPurpose("");
    setTimeframe("");
    setFocusAreas("");
    setWritingStyle("");
    setFrequency("");
    setCurrentSituation("");
    setGoals("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setPurpose(execution.inputs?.purpose || "");
    setTimeframe(execution.inputs?.timeframe || "");
    setFocusAreas(execution.inputs?.focusAreas || "");
    setWritingStyle(execution.inputs?.writingStyle || "");
    setFrequency(execution.inputs?.frequency || "");
    setCurrentSituation(execution.inputs?.currentSituation || "");
    setGoals(execution.inputs?.goals || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="personal-journal-prompts"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Personal Journal Prompts</h1>
              <p className="text-muted-foreground">
                Generate reflective writing prompts for personal growth and mindfulness
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Purpose & Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="purpose">Journaling Purpose *</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self-reflection">Self-reflection & awareness</SelectItem>
                      <SelectItem value="goal-setting">Goal setting & planning</SelectItem>
                      <SelectItem value="gratitude">Gratitude & positivity</SelectItem>
                      <SelectItem value="stress-relief">Stress relief & mental health</SelectItem>
                      <SelectItem value="creativity">Creativity & inspiration</SelectItem>
                      <SelectItem value="problem-solving">Problem-solving</SelectItem>
                      <SelectItem value="personal-growth">Personal growth</SelectItem>
                      <SelectItem value="relationships">Relationships & connections</SelectItem>
                      <SelectItem value="career">Career & professional development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="writingStyle">Writing Style *</Label>
                  <Select value={writingStyle} onValueChange={setWritingStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free-writing">Free-form writing</SelectItem>
                      <SelectItem value="structured">Structured & organized</SelectItem>
                      <SelectItem value="creative">Creative & artistic</SelectItem>
                      <SelectItem value="analytical">Analytical & logical</SelectItem>
                      <SelectItem value="short-entries">Short & concise</SelectItem>
                      <SelectItem value="detailed">Detailed & thorough</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Frequency & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="frequency">Journaling Frequency *</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="as-needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeframe">Timeframe (Optional)</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 month">1 month</SelectItem>
                      <SelectItem value="3 months">3 months</SelectItem>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="1 year">1 year</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Focus Areas *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="focusAreas"
                value={focusAreas}
                onChange={(e) => setFocusAreas(e.target.value)}
                placeholder="What areas of life would you like to explore? e.g., relationships, career, health, personal values, creativity..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Current Life Situation (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="currentSituation"
                  value={currentSituation}
                  onChange={(e) => setCurrentSituation(e.target.value)}
                  placeholder="Describe your current life circumstances or challenges..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Goals (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="goals"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="What are you hoping to achieve or work towards?"
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !purpose.trim() || !focusAreas.trim() || !writingStyle.trim() || !frequency.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Creating Prompts...
                </>
              ) : (
                "Generate Journal Prompts"
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
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in your journaling preferences above to generate personalized writing prompts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}