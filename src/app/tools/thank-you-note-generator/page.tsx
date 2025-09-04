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
import { MessageSquare, Users, Gift, Heart } from "lucide-react";

export default function ThankYouNoteGeneratorPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("thank-you-note-generator");
  const [recipient, setRecipient] = useState("");
  const [occasion, setOccasion] = useState("");
  const [whatTheyDid, setWhatTheyDid] = useState("");
  const [personalDetails, setPersonalDetails] = useState("");
  const [tone, setTone] = useState("");
  const [relationship, setRelationship] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/thank-you-note-generator",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { recipient, occasion, whatTheyDid, personalDetails, tone, relationship },
        outputs: { note: message.content },
      });
    },
    onError: (error) => {
      console.error("Thank you note generator error:", error);
    },
  });

  const handleGenerate = () => {
    if (!recipient.trim() || !occasion.trim() || !whatTheyDid.trim() || !tone.trim() || !relationship.trim()) return;

    const newInputs = { recipient, occasion, whatTheyDid, personalDetails, tone, relationship };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        recipient: recipient.trim(),
        occasion: occasion.trim(),
        whatTheyDid: whatTheyDid.trim(),
        personalDetails: personalDetails.trim(),
        tone: tone.trim(),
        relationship: relationship.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setRecipient("");
    setOccasion("");
    setWhatTheyDid("");
    setPersonalDetails("");
    setTone("");
    setRelationship("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setRecipient(execution.inputs?.recipient || "");
    setOccasion(execution.inputs?.occasion || "");
    setWhatTheyDid(execution.inputs?.whatTheyDid || "");
    setPersonalDetails(execution.inputs?.personalDetails || "");
    setTone(execution.inputs?.tone || "");
    setRelationship(execution.inputs?.relationship || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="thank-you-note-generator"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Thank You Note Generator</h1>
              <p className="text-muted-foreground">
                Generate personalized thank you messages with heartfelt appreciation
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recipient & Relationship
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipient">Recipient Name *</Label>
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g., Sarah, Dr. Johnson, Mom and Dad"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Your Relationship *</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family Member</SelectItem>
                      <SelectItem value="close-friend">Close Friend</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="colleague">Work Colleague</SelectItem>
                      <SelectItem value="manager">Manager/Boss</SelectItem>
                      <SelectItem value="employee">Employee/Team Member</SelectItem>
                      <SelectItem value="client">Client/Customer</SelectItem>
                      <SelectItem value="business-partner">Business Partner</SelectItem>
                      <SelectItem value="mentor">Mentor/Teacher</SelectItem>
                      <SelectItem value="service-provider">Service Provider</SelectItem>
                      <SelectItem value="neighbor">Neighbor</SelectItem>
                      <SelectItem value="acquaintance">Acquaintance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Occasion & Tone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="occasion">Occasion/Reason *</Label>
                  <Select value={occasion} onValueChange={setOccasion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gift">Gift Received</SelectItem>
                      <SelectItem value="favor">Favor/Help</SelectItem>
                      <SelectItem value="hospitality">Hospitality/Hosting</SelectItem>
                      <SelectItem value="support">Support/Encouragement</SelectItem>
                      <SelectItem value="work-help">Work Assistance</SelectItem>
                      <SelectItem value="referral">Referral/Recommendation</SelectItem>
                      <SelectItem value="interview">Job Interview</SelectItem>
                      <SelectItem value="meeting">Meeting/Time</SelectItem>
                      <SelectItem value="collaboration">Collaboration</SelectItem>
                      <SelectItem value="condolence">Condolence Support</SelectItem>
                      <SelectItem value="celebration">Celebration Attendance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                      <SelectItem value="warm-personal">Warm & Personal</SelectItem>
                      <SelectItem value="formal-professional">Formal & Professional</SelectItem>
                      <SelectItem value="casual-friendly">Casual & Friendly</SelectItem>
                      <SelectItem value="heartfelt-emotional">Heartfelt & Emotional</SelectItem>
                      <SelectItem value="grateful-humble">Grateful & Humble</SelectItem>
                      <SelectItem value="enthusiastic-joyful">Enthusiastic & Joyful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>What They Did *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="whatTheyDid"
                value={whatTheyDid}
                onChange={(e) => setWhatTheyDid(e.target.value)}
                placeholder="Describe specifically what they did for you. Be detailed about their actions, kindness, or help..."
                rows={3}
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Personal Details to Include (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="personalDetails"
                value={personalDetails}
                onChange={(e) => setPersonalDetails(e.target.value)}
                placeholder="Any personal touches, memories, or specific impacts you'd like to mention..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !recipient.trim() || !occasion.trim() || !whatTheyDid.trim() || !tone.trim() || !relationship.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Writing Thank You Note...
                </>
              ) : (
                "Generate Thank You Note"
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
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in the details above to create a heartfelt thank you note.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}