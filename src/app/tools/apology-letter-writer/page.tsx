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
import { Heart, Users, AlertTriangle, CheckCircle } from "lucide-react";

export default function ApologyLetterWriterPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("apology-letter-writer");
  const [situation, setSituation] = useState("");
  const [relationship, setRelationship] = useState("");
  const [wrongdoing, setWrongdoing] = useState("");
  const [impact, setImpact] = useState("");
  const [tone, setTone] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/apology-letter-writer",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { situation, relationship, wrongdoing, impact, tone, actionsTaken },
        outputs: { letter: message.content },
      });
    },
    onError: (error) => {
      console.error("Apology letter writer error:", error);
    },
  });

  const handleGenerate = () => {
    if (!situation.trim() || !relationship.trim() || !wrongdoing.trim() || !impact.trim() || !tone.trim()) return;

    const newInputs = { situation, relationship, wrongdoing, impact, tone, actionsTaken };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        situation: situation.trim(),
        relationship: relationship.trim(),
        wrongdoing: wrongdoing.trim(),
        impact: impact.trim(),
        tone: tone.trim(),
        actionsTaken: actionsTaken.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setSituation("");
    setRelationship("");
    setWrongdoing("");
    setImpact("");
    setTone("");
    setActionsTaken("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setSituation(execution.inputs?.situation || "");
    setRelationship(execution.inputs?.relationship || "");
    setWrongdoing(execution.inputs?.wrongdoing || "");
    setImpact(execution.inputs?.impact || "");
    setTone(execution.inputs?.tone || "");
    setActionsTaken(execution.inputs?.actionsTaken || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="apology-letter-writer"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Apology Letter Writer</h1>
              <p className="text-muted-foreground">
                Create sincere, appropriate apology letters that demonstrate accountability
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Situation & Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="situation">Situation Overview *</Label>
                  <Textarea
                    id="situation"
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="Briefly describe what happened and the context of the situation..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship to Recipient *</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse-partner">Spouse/Partner</SelectItem>
                      <SelectItem value="family">Family Member</SelectItem>
                      <SelectItem value="close-friend">Close Friend</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="colleague">Work Colleague</SelectItem>
                      <SelectItem value="manager">Manager/Boss</SelectItem>
                      <SelectItem value="employee">Employee/Subordinate</SelectItem>
                      <SelectItem value="client">Client/Customer</SelectItem>
                      <SelectItem value="business-partner">Business Partner</SelectItem>
                      <SelectItem value="neighbor">Neighbor</SelectItem>
                      <SelectItem value="acquaintance">Acquaintance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Apology Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tone">Desired Tone *</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heartfelt-personal">Heartfelt & Personal</SelectItem>
                      <SelectItem value="formal-professional">Formal & Professional</SelectItem>
                      <SelectItem value="humble-contrite">Humble & Contrite</SelectItem>
                      <SelectItem value="sincere-direct">Sincere & Direct</SelectItem>
                      <SelectItem value="warm-caring">Warm & Caring</SelectItem>
                      <SelectItem value="respectful-measured">Respectful & Measured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>What Was Done Wrong *</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="wrongdoing"
                  value={wrongdoing}
                  onChange={(e) => setWrongdoing(e.target.value)}
                  placeholder="Be specific about what you did wrong. Take full responsibility without making excuses..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact on Them *</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="impact"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  placeholder="How did your actions affect them? What hurt, inconvenience, or harm did it cause?"
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Actions Already Taken (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="actionsTaken"
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                placeholder="What steps have you already taken to address the situation or make amends?"
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !situation.trim() || !relationship.trim() || !wrongdoing.trim() || !impact.trim() || !tone.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Writing Apology...
                </>
              ) : (
                "Generate Apology Letter"
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
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in the details above to create a sincere, meaningful apology letter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}