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
import { MessageCircle, Users, Coffee, Target } from "lucide-react";

export default function SmallTalkGeneratorPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("small-talk-generator");
  const [context, setContext] = useState("");
  const [audience, setAudience] = useState("");
  const [personality, setPersonality] = useState("");
  const [topics, setTopics] = useState("");
  const [purpose, setPurpose] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/small-talk-generator",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { context, audience, personality, topics, purpose },
        outputs: { starters: message.content },
      });
    },
    onError: (error) => {
      console.error("Small talk generator error:", error);
    },
  });

  const handleGenerate = () => {
    if (!context.trim() || !audience.trim() || !personality.trim()) return;

    const newInputs = { context, audience, personality, topics, purpose };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        context: context.trim(),
        audience: audience.trim(),
        personality: personality.trim(),
        topics: topics.trim(),
        purpose: purpose.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setContext("");
    setAudience("");
    setPersonality("");
    setTopics("");
    setPurpose("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setContext(execution.inputs?.context || "");
    setAudience(execution.inputs?.audience || "");
    setPersonality(execution.inputs?.personality || "");
    setTopics(execution.inputs?.topics || "");
    setPurpose(execution.inputs?.purpose || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="small-talk-generator"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Small Talk Generator</h1>
              <p className="text-muted-foreground">
                Generate conversation starters for networking and social situations
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  Setting & Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="context">Context/Setting *</Label>
                  <Select value={context} onValueChange={setContext}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select context" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="networking-event">Networking Event</SelectItem>
                      <SelectItem value="conference">Conference/Professional</SelectItem>
                      <SelectItem value="party">Social Party</SelectItem>
                      <SelectItem value="workplace">Workplace/Office</SelectItem>
                      <SelectItem value="coffee-meeting">Coffee Meeting</SelectItem>
                      <SelectItem value="elevator">Elevator/Brief Encounter</SelectItem>
                      <SelectItem value="waiting-room">Waiting Room</SelectItem>
                      <SelectItem value="wedding">Wedding/Celebration</SelectItem>
                      <SelectItem value="gym">Gym/Fitness</SelectItem>
                      <SelectItem value="online-meeting">Virtual/Online Meeting</SelectItem>
                      <SelectItem value="public-transport">Public Transport</SelectItem>
                      <SelectItem value="neighborhood">Neighborhood/Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="What's your goal?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="networking">Professional networking</SelectItem>
                      <SelectItem value="making-friends">Making new friends</SelectItem>
                      <SelectItem value="breaking-ice">Breaking the ice</SelectItem>
                      <SelectItem value="being-polite">Being polite/courteous</SelectItem>
                      <SelectItem value="finding-common-ground">Finding common interests</SelectItem>
                      <SelectItem value="starting-relationship">Starting a relationship</SelectItem>
                      <SelectItem value="reconnecting">Reconnecting with someone</SelectItem>
                      <SelectItem value="being-inclusive">Including others in conversation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Audience & Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="audience">Audience Type *</Label>
                  <Input
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Business professionals, College students, Parents"
                  />
                </div>
                <div>
                  <Label htmlFor="personality">Your Communication Style *</Label>
                  <Select value={personality} onValueChange={setPersonality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outgoing">Outgoing & Confident</SelectItem>
                      <SelectItem value="reserved">Reserved & Thoughtful</SelectItem>
                      <SelectItem value="humorous">Humorous & Playful</SelectItem>
                      <SelectItem value="professional">Professional & Formal</SelectItem>
                      <SelectItem value="casual">Casual & Relaxed</SelectItem>
                      <SelectItem value="curious">Curious & Inquisitive</SelectItem>
                      <SelectItem value="warm">Warm & Friendly</SelectItem>
                      <SelectItem value="intellectual">Intellectual & Deep</SelectItem>
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
                Preferred Topics (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="topics"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="What topics are you comfortable discussing? e.g., Travel, technology, hobbies, current events..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !context.trim() || !audience.trim() || !personality.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Generating Starters...
                </>
              ) : (
                "Generate Conversation Starters"
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
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in the details above to get personalized conversation starters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}