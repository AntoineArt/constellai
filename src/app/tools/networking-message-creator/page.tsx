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
import { Network, Users, MessageCircle, Target } from "lucide-react";

export default function NetworkingMessageCreatorPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("networking-message-creator");
  const [messageType, setMessageType] = useState("");
  const [recipient, setRecipient] = useState("");
  const [context, setContext] = useState("");
  const [relationship, setRelationship] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("");
  const [personalDetails, setPersonalDetails] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/networking-message-creator",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { messageType, recipient, context, relationship, purpose, tone, personalDetails },
        outputs: { message: message.content },
      });
    },
    onError: (error) => {
      console.error("Networking message creator error:", error);
    },
  });

  const handleGenerate = () => {
    if (!messageType.trim() || !recipient.trim() || !context.trim() || !relationship.trim() || !purpose.trim() || !tone.trim()) return;

    const newInputs = { messageType, recipient, context, relationship, purpose, tone, personalDetails };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        messageType: messageType.trim(),
        recipient: recipient.trim(),
        context: context.trim(),
        relationship: relationship.trim(),
        purpose: purpose.trim(),
        tone: tone.trim(),
        personalDetails: personalDetails.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setMessageType("");
    setRecipient("");
    setContext("");
    setRelationship("");
    setPurpose("");
    setTone("");
    setPersonalDetails("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setMessageType(execution.inputs?.messageType || "");
    setRecipient(execution.inputs?.recipient || "");
    setContext(execution.inputs?.context || "");
    setRelationship(execution.inputs?.relationship || "");
    setPurpose(execution.inputs?.purpose || "");
    setTone(execution.inputs?.tone || "");
    setPersonalDetails(execution.inputs?.personalDetails || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="networking-message-creator"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Networking Message Creator</h1>
              <p className="text-muted-foreground">
                Generate professional networking messages that build meaningful connections
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Message Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="messageType">Message Type *</Label>
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select message type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linkedin-connection">LinkedIn Connection Request</SelectItem>
                      <SelectItem value="linkedin-message">LinkedIn Message</SelectItem>
                      <SelectItem value="email-introduction">Email Introduction</SelectItem>
                      <SelectItem value="follow-up">Follow-up Message</SelectItem>
                      <SelectItem value="informational-interview">Informational Interview Request</SelectItem>
                      <SelectItem value="job-inquiry">Job Opportunity Inquiry</SelectItem>
                      <SelectItem value="collaboration">Collaboration Proposal</SelectItem>
                      <SelectItem value="referral-request">Referral Request</SelectItem>
                      <SelectItem value="thank-you-followup">Thank You Follow-up</SelectItem>
                      <SelectItem value="reconnection">Reconnection Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recipient">Recipient *</Label>
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g., Sarah Johnson, Head of Marketing at TechCorp"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Relationship & Tone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="relationship">Current Relationship *</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complete-stranger">Complete Stranger</SelectItem>
                      <SelectItem value="met-briefly">Met Briefly</SelectItem>
                      <SelectItem value="mutual-connections">Mutual Connections</SelectItem>
                      <SelectItem value="former-colleague">Former Colleague</SelectItem>
                      <SelectItem value="same-company">Same Company</SelectItem>
                      <SelectItem value="same-industry">Same Industry</SelectItem>
                      <SelectItem value="alumni-connection">Alumni Connection</SelectItem>
                      <SelectItem value="conference-contact">Met at Conference/Event</SelectItem>
                      <SelectItem value="online-community">Online Community Member</SelectItem>
                      <SelectItem value="reconnecting">Reconnecting After Time</SelectItem>
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
                      <SelectItem value="professional-formal">Professional & Formal</SelectItem>
                      <SelectItem value="professional-friendly">Professional & Friendly</SelectItem>
                      <SelectItem value="casual-approachable">Casual & Approachable</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                      <SelectItem value="respectful-humble">Respectful & Humble</SelectItem>
                      <SelectItem value="confident-direct">Confident & Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Context/How You Know Them *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe how you know them or discovered them. e.g., Met at XYZ conference, Found through mutual connection John Smith, Saw their article on LinkedIn..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Purpose *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="What do you hope to achieve? e.g., Learn about their career path, Explore job opportunities, Discuss potential collaboration..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Details (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="personalDetails"
                  value={personalDetails}
                  onChange={(e) => setPersonalDetails(e.target.value)}
                  placeholder="Any personal details, shared interests, or specific reasons for connecting that would make the message more personal..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !messageType.trim() || !recipient.trim() || !context.trim() || !relationship.trim() || !purpose.trim() || !tone.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Creating Message...
                </>
              ) : (
                "Generate Networking Message"
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
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in the details above to create professional networking messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}