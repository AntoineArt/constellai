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
import { Presentation, Users, Clock, Target } from "lucide-react";

export default function PresentationOutlinerPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("presentation-outliner");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [purpose, setPurpose] = useState("");
  const [keyMessages, setKeyMessages] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/presentation-outliner",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { topic, audience, duration, purpose, keyMessages },
        outputs: { outline: message.content },
      });
    },
    onError: (error) => {
      console.error("Presentation outliner error:", error);
    },
  });

  const handleGenerate = () => {
    if (!topic.trim() || !audience.trim() || !duration.trim() || !purpose.trim()) return;

    const newInputs = { topic, audience, duration, purpose, keyMessages };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        topic: topic.trim(),
        audience: audience.trim(),
        duration: duration.trim(),
        purpose: purpose.trim(),
        keyMessages: keyMessages.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setTopic("");
    setAudience("");
    setDuration("");
    setPurpose("");
    setKeyMessages("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setTopic(execution.inputs?.topic || "");
    setAudience(execution.inputs?.audience || "");
    setDuration(execution.inputs?.duration || "");
    setPurpose(execution.inputs?.purpose || "");
    setKeyMessages(execution.inputs?.keyMessages || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="presentation-outliner"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Presentation className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Presentation Outliner</h1>
              <p className="text-muted-foreground">
                Create structured presentation outlines with timing and engagement strategies
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Presentation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topic">Presentation Topic *</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Digital Marketing Strategy for 2025"
                  />
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose/Objective *</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select presentation purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inform">Inform/Educate</SelectItem>
                      <SelectItem value="persuade">Persuade/Convince</SelectItem>
                      <SelectItem value="inspire">Inspire/Motivate</SelectItem>
                      <SelectItem value="train">Train/Instruct</SelectItem>
                      <SelectItem value="sell">Sell/Pitch</SelectItem>
                      <SelectItem value="report">Report/Update</SelectItem>
                      <SelectItem value="entertain">Entertain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Audience & Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="audience">Target Audience *</Label>
                  <Input
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Marketing executives, C-suite, Students"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration *</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5 minutes">5 minutes (Lightning talk)</SelectItem>
                      <SelectItem value="10 minutes">10 minutes (Short presentation)</SelectItem>
                      <SelectItem value="15 minutes">15 minutes (TED-style)</SelectItem>
                      <SelectItem value="20 minutes">20 minutes (Standard)</SelectItem>
                      <SelectItem value="30 minutes">30 minutes (Extended)</SelectItem>
                      <SelectItem value="45 minutes">45 minutes (Workshop style)</SelectItem>
                      <SelectItem value="60 minutes">60 minutes (Full session)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Key Messages (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="keyMessages"
                value={keyMessages}
                onChange={(e) => setKeyMessages(e.target.value)}
                placeholder="Enter 2-3 key messages or takeaways you want your audience to remember..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !topic.trim() || !audience.trim() || !duration.trim() || !purpose.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Generating Outline...
                </>
              ) : (
                "Generate Presentation Outline"
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
              <Presentation className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in the presentation details above to generate your structured outline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}