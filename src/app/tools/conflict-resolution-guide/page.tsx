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
import { HandHeart, Users, Target, AlertTriangle } from "lucide-react";

export default function ConflictResolutionGuidePage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("conflict-resolution-guide");
  const [conflictType, setConflictType] = useState("");
  const [parties, setParties] = useState("");
  const [situation, setSituation] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/conflict-resolution-guide",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { conflictType, parties, situation, relationshipType, desiredOutcome },
        outputs: { guide: message.content },
      });
    },
    onError: (error) => {
      console.error("Conflict resolution guide error:", error);
    },
  });

  const handleGenerate = () => {
    if (!conflictType.trim() || !parties.trim() || !situation.trim() || !relationshipType.trim()) return;

    const newInputs = { conflictType, parties, situation, relationshipType, desiredOutcome };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        conflictType: conflictType.trim(),
        parties: parties.trim(),
        situation: situation.trim(),
        relationshipType: relationshipType.trim(),
        desiredOutcome: desiredOutcome.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setConflictType("");
    setParties("");
    setSituation("");
    setRelationshipType("");
    setDesiredOutcome("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setConflictType(execution.inputs?.conflictType || "");
    setParties(execution.inputs?.parties || "");
    setSituation(execution.inputs?.situation || "");
    setRelationshipType(execution.inputs?.relationshipType || "");
    setDesiredOutcome(execution.inputs?.desiredOutcome || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="conflict-resolution-guide"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HandHeart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Conflict Resolution Guide</h1>
              <p className="text-muted-foreground">
                Generate mediation strategies and communication techniques for resolving conflicts
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Conflict Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="conflictType">Type of Conflict *</Label>
                  <Select value={conflictType} onValueChange={setConflictType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select conflict type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workplace">Workplace Disagreement</SelectItem>
                      <SelectItem value="family">Family/Personal</SelectItem>
                      <SelectItem value="romantic">Romantic Relationship</SelectItem>
                      <SelectItem value="friendship">Friendship</SelectItem>
                      <SelectItem value="business">Business/Professional</SelectItem>
                      <SelectItem value="neighbor">Neighbor/Community</SelectItem>
                      <SelectItem value="team">Team/Group Project</SelectItem>
                      <SelectItem value="financial">Financial/Money</SelectItem>
                      <SelectItem value="property">Property/Resource</SelectItem>
                      <SelectItem value="communication">Communication/Miscommunication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="relationshipType">Relationship Context *</Label>
                  <Select value={relationshipType} onValueChange={setRelationshipType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colleagues">Work Colleagues</SelectItem>
                      <SelectItem value="manager-employee">Manager-Employee</SelectItem>
                      <SelectItem value="spouses">Spouses/Partners</SelectItem>
                      <SelectItem value="parent-child">Parent-Child</SelectItem>
                      <SelectItem value="siblings">Siblings</SelectItem>
                      <SelectItem value="friends">Friends</SelectItem>
                      <SelectItem value="business-partners">Business Partners</SelectItem>
                      <SelectItem value="neighbors">Neighbors</SelectItem>
                      <SelectItem value="strangers">Strangers/First Time</SelectItem>
                      <SelectItem value="ongoing">Ongoing Relationship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Parties & Outcome
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="parties">Parties Involved *</Label>
                  <Input
                    id="parties"
                    value={parties}
                    onChange={(e) => setParties(e.target.value)}
                    placeholder="e.g., You and coworker, Two team members, Family members"
                  />
                </div>
                <div>
                  <Label htmlFor="desiredOutcome">Desired Outcome (Optional)</Label>
                  <Select value={desiredOutcome} onValueChange={setDesiredOutcome}>
                    <SelectTrigger>
                      <SelectValue placeholder="What do you hope to achieve?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="understanding">Better understanding</SelectItem>
                      <SelectItem value="compromise">Fair compromise</SelectItem>
                      <SelectItem value="repair">Repair relationship</SelectItem>
                      <SelectItem value="closure">Get closure</SelectItem>
                      <SelectItem value="cooperation">Improve cooperation</SelectItem>
                      <SelectItem value="boundaries">Set clear boundaries</SelectItem>
                      <SelectItem value="prevention">Prevent future conflicts</SelectItem>
                      <SelectItem value="communication">Better communication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Situation Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Describe the conflict situation in detail. What happened? What are the main points of disagreement? What has been tried so far?"
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !conflictType.trim() || !parties.trim() || !situation.trim() || !relationshipType.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Generating Guide...
                </>
              ) : (
                "Generate Resolution Guide"
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
              <HandHeart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Describe your conflict situation to get personalized resolution strategies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}