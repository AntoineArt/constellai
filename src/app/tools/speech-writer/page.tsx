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
import { Mic, Users, Clock, Heart } from "lucide-react";

export default function SpeechWriterPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("speech-writer");
  const [occasion, setOccasion] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [tone, setTone] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [personalStories, setPersonalStories] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/speech-writer",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { occasion, audience, duration, tone, keyPoints, personalStories },
        outputs: { speech: message.content },
      });
    },
    onError: (error) => {
      console.error("Speech writer error:", error);
    },
  });

  const handleGenerate = () => {
    if (!occasion.trim() || !audience.trim() || !duration.trim() || !tone.trim() || !keyPoints.trim()) return;

    const newInputs = { occasion, audience, duration, tone, keyPoints, personalStories };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        occasion: occasion.trim(),
        audience: audience.trim(),
        duration: duration.trim(),
        tone: tone.trim(),
        keyPoints: keyPoints.trim(),
        personalStories: personalStories.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setOccasion("");
    setAudience("");
    setDuration("");
    setTone("");
    setKeyPoints("");
    setPersonalStories("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setOccasion(execution.inputs?.occasion || "");
    setAudience(execution.inputs?.audience || "");
    setDuration(execution.inputs?.duration || "");
    setTone(execution.inputs?.tone || "");
    setKeyPoints(execution.inputs?.keyPoints || "");
    setPersonalStories(execution.inputs?.personalStories || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="speech-writer"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Speech Writer</h1>
              <p className="text-muted-foreground">
                Generate compelling speeches for various occasions with delivery notes
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Speech Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="occasion">Occasion *</Label>
                  <Select value={occasion} onValueChange={setOccasion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="retirement">Retirement</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="memorial">Memorial/Funeral</SelectItem>
                      <SelectItem value="conference">Conference/Business</SelectItem>
                      <SelectItem value="award">Award Ceremony</SelectItem>
                      <SelectItem value="fundraiser">Fundraising Event</SelectItem>
                      <SelectItem value="political">Political Rally</SelectItem>
                      <SelectItem value="motivational">Motivational Talk</SelectItem>
                      <SelectItem value="custom">Custom Occasion</SelectItem>
                    </SelectContent>
                  </Select>
                  {occasion === "custom" && (
                    <Input
                      className="mt-2"
                      placeholder="Describe the custom occasion..."
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="tone">Speech Tone *</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heartfelt">Heartfelt & Emotional</SelectItem>
                      <SelectItem value="humorous">Humorous & Light</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                      <SelectItem value="formal">Formal & Professional</SelectItem>
                      <SelectItem value="casual">Casual & Friendly</SelectItem>
                      <SelectItem value="solemn">Solemn & Respectful</SelectItem>
                      <SelectItem value="celebratory">Celebratory & Joyful</SelectItem>
                      <SelectItem value="persuasive">Persuasive & Convincing</SelectItem>
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
                  <Label htmlFor="audience">Audience *</Label>
                  <Input
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Family and friends, Company employees, Students"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration *</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-3 minutes">2-3 minutes (Short toast)</SelectItem>
                      <SelectItem value="5 minutes">5 minutes (Standard)</SelectItem>
                      <SelectItem value="10 minutes">10 minutes (Extended)</SelectItem>
                      <SelectItem value="15 minutes">15 minutes (Keynote)</SelectItem>
                      <SelectItem value="20+ minutes">20+ minutes (Full address)</SelectItem>
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
                Speech Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keyPoints">Key Points to Cover *</Label>
                <Textarea
                  id="keyPoints"
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="List the main points or messages you want to convey in your speech..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="personalStories">Personal Stories/Examples (Optional)</Label>
                <Textarea
                  id="personalStories"
                  value={personalStories}
                  onChange={(e) => setPersonalStories(e.target.value)}
                  placeholder="Share any personal anecdotes, memories, or examples you'd like to include..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !occasion.trim() || !audience.trim() || !duration.trim() || !tone.trim() || !keyPoints.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Writing Speech...
                </>
              ) : (
                "Generate Speech"
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
              <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in the speech details above to generate your compelling speech.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}