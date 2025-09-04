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
import { Handshake, Target, Users, AlertTriangle } from "lucide-react";

export default function NegotiationPrepToolPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("negotiation-prep-tool");
  const [negotiationType, setNegotiationType] = useState("");
  const [context, setContext] = useState("");
  const [yourPosition, setYourPosition] = useState("");
  const [theirPosition, setTheirPosition] = useState("");
  const [priorities, setPriorities] = useState("");
  const [constraints, setConstraints] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/negotiation-prep-tool",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { negotiationType, context, yourPosition, theirPosition, priorities, constraints },
        outputs: { guide: message.content },
      });
    },
    onError: (error) => {
      console.error("Negotiation prep tool error:", error);
    },
  });

  const handleGenerate = () => {
    if (!negotiationType.trim() || !context.trim() || !yourPosition.trim() || !theirPosition.trim() || !priorities.trim()) return;

    const newInputs = { negotiationType, context, yourPosition, theirPosition, priorities, constraints };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        negotiationType: negotiationType.trim(),
        context: context.trim(),
        yourPosition: yourPosition.trim(),
        theirPosition: theirPosition.trim(),
        priorities: priorities.trim(),
        constraints: constraints.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setNegotiationType("");
    setContext("");
    setYourPosition("");
    setTheirPosition("");
    setPriorities("");
    setConstraints("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setNegotiationType(execution.inputs?.negotiationType || "");
    setContext(execution.inputs?.context || "");
    setYourPosition(execution.inputs?.yourPosition || "");
    setTheirPosition(execution.inputs?.theirPosition || "");
    setPriorities(execution.inputs?.priorities || "");
    setConstraints(execution.inputs?.constraints || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="negotiation-prep-tool"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Handshake className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Negotiation Prep Tool</h1>
              <p className="text-muted-foreground">
                Prepare negotiation strategies and talking points with tactical approaches
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Negotiation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="negotiationType">Type of Negotiation *</Label>
                  <Select value={negotiationType} onValueChange={setNegotiationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select negotiation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary/Compensation</SelectItem>
                      <SelectItem value="contract">Business Contract</SelectItem>
                      <SelectItem value="price">Price/Deal</SelectItem>
                      <SelectItem value="promotion">Job Promotion</SelectItem>
                      <SelectItem value="deadline">Project Timeline</SelectItem>
                      <SelectItem value="partnership">Partnership Terms</SelectItem>
                      <SelectItem value="vendor">Vendor Agreement</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="divorce">Divorce Settlement</SelectItem>
                      <SelectItem value="dispute">Dispute Resolution</SelectItem>
                      <SelectItem value="merger">Merger/Acquisition</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="context">Context/Background *</Label>
                  <Textarea
                    id="context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Provide background context. What led to this negotiation? What's the current situation?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Positions & Priorities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="yourPosition">Your Position/Goals *</Label>
                  <Textarea
                    id="yourPosition"
                    value={yourPosition}
                    onChange={(e) => setYourPosition(e.target.value)}
                    placeholder="What do you want to achieve? What are your main goals and desired outcomes?"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="theirPosition">Their Likely Position *</Label>
                  <Textarea
                    id="theirPosition"
                    value={theirPosition}
                    onChange={(e) => setTheirPosition(e.target.value)}
                    placeholder="What do they likely want? What are their potential goals and concerns?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Your Priorities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="priorities"
                  value={priorities}
                  onChange={(e) => setPriorities(e.target.value)}
                  placeholder="List your priorities in order of importance. What are your must-haves vs. nice-to-haves?"
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Constraints/Limitations (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="constraints"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="What constraints do you have? Budget limits, deadlines, company policies, etc."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !negotiationType.trim() || !context.trim() || !yourPosition.trim() || !theirPosition.trim() || !priorities.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Generating Strategy...
                </>
              ) : (
                "Generate Negotiation Strategy"
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
              <Handshake className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in the negotiation details above to get strategic preparation guidance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}