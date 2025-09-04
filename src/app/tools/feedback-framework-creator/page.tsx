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
import { Users, Target, MessageCircle, CheckCircle } from "lucide-react";

export default function FeedbackFrameworkCreatorPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("feedback-framework-creator");
  const [feedbackType, setFeedbackType] = useState("");
  const [recipient, setRecipient] = useState("");
  const [situation, setSituation] = useState("");
  const [relationship, setRelationship] = useState("");
  const [goals, setGoals] = useState("");
  const [tone, setTone] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/feedback-framework-creator",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { feedbackType, recipient, situation, relationship, goals, tone },
        outputs: { framework: message.content },
      });
    },
    onError: (error) => {
      console.error("Feedback framework creator error:", error);
    },
  });

  const handleGenerate = () => {
    if (!feedbackType.trim() || !recipient.trim() || !situation.trim() || !relationship.trim() || !goals.trim() || !tone.trim()) return;

    const newInputs = { feedbackType, recipient, situation, relationship, goals, tone };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        feedbackType: feedbackType.trim(),
        recipient: recipient.trim(),
        situation: situation.trim(),
        relationship: relationship.trim(),
        goals: goals.trim(),
        tone: tone.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setFeedbackType("");
    setRecipient("");
    setSituation("");
    setRelationship("");
    setGoals("");
    setTone("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setFeedbackType(execution.inputs?.feedbackType || "");
    setRecipient(execution.inputs?.recipient || "");
    setSituation(execution.inputs?.situation || "");
    setRelationship(execution.inputs?.relationship || "");
    setGoals(execution.inputs?.goals || "");
    setTone(execution.inputs?.tone || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="feedback-framework-creator"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Feedback Framework Creator</h1>
              <p className="text-muted-foreground">
                Structure constructive feedback with proven frameworks and delivery strategies
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Feedback Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="feedbackType">Type of Feedback *</Label>
                  <Select value={feedbackType} onValueChange={setFeedbackType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select feedback type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance-review">Performance Review</SelectItem>
                      <SelectItem value="constructive-criticism">Constructive Criticism</SelectItem>
                      <SelectItem value="positive-reinforcement">Positive Reinforcement</SelectItem>
                      <SelectItem value="developmental">Developmental Feedback</SelectItem>
                      <SelectItem value="behavioral">Behavioral Feedback</SelectItem>
                      <SelectItem value="project-feedback">Project Feedback</SelectItem>
                      <SelectItem value="skill-improvement">Skill Improvement</SelectItem>
                      <SelectItem value="goal-setting">Goal Setting</SelectItem>
                      <SelectItem value="difficult-conversation">Difficult Conversation</SelectItem>
                      <SelectItem value="360-feedback">360° Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recipient">Recipient *</Label>
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g., Team member, Direct report, Colleague"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Context & Relationship
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="relationship">Your Relationship *</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager-direct-report">Manager to Direct Report</SelectItem>
                      <SelectItem value="peer-colleague">Peer/Colleague</SelectItem>
                      <SelectItem value="senior-junior">Senior to Junior</SelectItem>
                      <SelectItem value="team-lead">Team Lead to Member</SelectItem>
                      <SelectItem value="mentor-mentee">Mentor to Mentee</SelectItem>
                      <SelectItem value="project-manager">Project Manager to Team</SelectItem>
                      <SelectItem value="cross-functional">Cross-functional Partner</SelectItem>
                      <SelectItem value="client-vendor">Client to Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tone">Desired Tone *</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supportive-encouraging">Supportive & Encouraging</SelectItem>
                      <SelectItem value="direct-honest">Direct & Honest</SelectItem>
                      <SelectItem value="collaborative">Collaborative</SelectItem>
                      <SelectItem value="formal-professional">Formal & Professional</SelectItem>
                      <SelectItem value="caring-empathetic">Caring & Empathetic</SelectItem>
                      <SelectItem value="solution-focused">Solution-focused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Situation/Context *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Describe the specific situation, behavior, or performance issue you want to address..."
                rows={3}
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Feedback Goals *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="What do you hope to achieve with this feedback? What changes or improvements are you looking for?"
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !feedbackType.trim() || !recipient.trim() || !situation.trim() || !relationship.trim() || !goals.trim() || !tone.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Creating Framework...
                </>
              ) : (
                "Generate Feedback Framework"
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
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in the feedback details above to create a structured framework.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}