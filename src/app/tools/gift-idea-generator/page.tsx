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
import { Gift, Users, DollarSign, Heart } from "lucide-react";

export default function GiftIdeaGeneratorPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("gift-idea-generator");
  const [recipient, setRecipient] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState("");
  const [relationship, setRelationship] = useState("");
  const [age, setAge] = useState("");
  const [personality, setPersonality] = useState("");
  const [restrictions, setRestrictions] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/gift-idea-generator",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { recipient, occasion, budget, interests, relationship, age, personality, restrictions },
        outputs: { giftIdeas: message.content },
      });
    },
    onError: (error) => {
      console.error("Gift idea generator error:", error);
    },
  });

  const handleGenerate = () => {
    if (!recipient.trim() || !occasion.trim() || !budget.trim() || !interests.trim() || !relationship.trim()) return;

    const newInputs = { recipient, occasion, budget, interests, relationship, age, personality, restrictions };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        recipient: recipient.trim(),
        occasion: occasion.trim(),
        budget: budget.trim(),
        interests: interests.trim(),
        relationship: relationship.trim(),
        age: age.trim(),
        personality: personality.trim(),
        restrictions: restrictions.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setRecipient("");
    setOccasion("");
    setBudget("");
    setInterests("");
    setRelationship("");
    setAge("");
    setPersonality("");
    setRestrictions("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setRecipient(execution.inputs?.recipient || "");
    setOccasion(execution.inputs?.occasion || "");
    setBudget(execution.inputs?.budget || "");
    setInterests(execution.inputs?.interests || "");
    setRelationship(execution.inputs?.relationship || "");
    setAge(execution.inputs?.age || "");
    setPersonality(execution.inputs?.personality || "");
    setRestrictions(execution.inputs?.restrictions || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="gift-idea-generator"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gift Idea Generator</h1>
              <p className="text-muted-foreground">
                Suggest thoughtful gifts for occasions with personalized recommendations
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recipient Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipient">Recipient Name/Description *</Label>
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g., Mom, Best friend Sarah, Coworker John"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Your Relationship *</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family-parent">Parent</SelectItem>
                      <SelectItem value="family-sibling">Sibling</SelectItem>
                      <SelectItem value="family-child">Child</SelectItem>
                      <SelectItem value="family-extended">Extended Family</SelectItem>
                      <SelectItem value="spouse-partner">Spouse/Partner</SelectItem>
                      <SelectItem value="best-friend">Best Friend</SelectItem>
                      <SelectItem value="close-friend">Close Friend</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="colleague">Work Colleague</SelectItem>
                      <SelectItem value="boss">Boss/Manager</SelectItem>
                      <SelectItem value="acquaintance">Acquaintance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="age">Age Range (Optional)</Label>
                  <Select value={age} onValueChange={setAge}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child-5-12">Child (5-12)</SelectItem>
                      <SelectItem value="teen-13-17">Teen (13-17)</SelectItem>
                      <SelectItem value="young-adult-18-25">Young Adult (18-25)</SelectItem>
                      <SelectItem value="adult-26-40">Adult (26-40)</SelectItem>
                      <SelectItem value="middle-age-41-60">Middle-age (41-60)</SelectItem>
                      <SelectItem value="senior-60+">Senior (60+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Occasion & Budget
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
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="christmas">Christmas</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="valentines">Valentine's Day</SelectItem>
                      <SelectItem value="mothers-day">Mother's Day</SelectItem>
                      <SelectItem value="fathers-day">Father's Day</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="baby-shower">Baby Shower</SelectItem>
                      <SelectItem value="housewarming">Housewarming</SelectItem>
                      <SelectItem value="retirement">Retirement</SelectItem>
                      <SelectItem value="thank-you">Thank You</SelectItem>
                      <SelectItem value="just-because">Just Because</SelectItem>
                      <SelectItem value="holiday">Holiday/Celebration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budget">Budget Range *</Label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-25">Under $25</SelectItem>
                      <SelectItem value="25-50">$25 - $50</SelectItem>
                      <SelectItem value="50-100">$50 - $100</SelectItem>
                      <SelectItem value="100-200">$100 - $200</SelectItem>
                      <SelectItem value="200-500">$200 - $500</SelectItem>
                      <SelectItem value="500+">$500+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Their Interests & Hobbies *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g., Reading, cooking, gardening, technology, sports, art, music, travel, fitness..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Personality (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="e.g., Practical, sentimental, adventurous, minimalist, tech-savvy, creative..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Any Restrictions (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="restrictions"
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  placeholder="e.g., Allergies, space constraints, already owns similar items..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !recipient.trim() || !occasion.trim() || !budget.trim() || !interests.trim() || !relationship.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Finding Gift Ideas...
                </>
              ) : (
                "Generate Gift Ideas"
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
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in the recipient details above to get personalized gift suggestions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}