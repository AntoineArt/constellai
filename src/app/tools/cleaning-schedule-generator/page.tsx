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
import { Sparkles, Home, Clock, Users } from "lucide-react";

export default function CleaningScheduleGeneratorPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("cleaning-schedule-generator");
  const [homeType, setHomeType] = useState("");
  const [homeSize, setHomeSize] = useState("");
  const [householdSize, setHouseholdSize] = useState("");
  const [cleaningFrequency, setCleaningFrequency] = useState("");
  const [timeAvailable, setTimeAvailable] = useState("");
  const [priorities, setPriorities] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [preferredDays, setPreferredDays] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/cleaning-schedule-generator",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { homeType, homeSize, householdSize, cleaningFrequency, timeAvailable, priorities, specialNeeds, preferredDays },
        outputs: { cleaningSchedule: message.content },
      });
    },
    onError: (error) => {
      console.error("Cleaning schedule generator error:", error);
    },
  });

  const handleGenerate = () => {
    if (!homeType.trim() || !homeSize.trim() || !householdSize.trim() || !cleaningFrequency.trim() || !timeAvailable.trim()) return;

    const newInputs = { homeType, homeSize, householdSize, cleaningFrequency, timeAvailable, priorities, specialNeeds, preferredDays };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        homeType: homeType.trim(),
        homeSize: homeSize.trim(),
        householdSize: householdSize.trim(),
        cleaningFrequency: cleaningFrequency.trim(),
        timeAvailable: timeAvailable.trim(),
        priorities: priorities.trim(),
        specialNeeds: specialNeeds.trim(),
        preferredDays: preferredDays.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setHomeType("");
    setHomeSize("");
    setHouseholdSize("");
    setCleaningFrequency("");
    setTimeAvailable("");
    setPriorities("");
    setSpecialNeeds("");
    setPreferredDays("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setHomeType(execution.inputs?.homeType || "");
    setHomeSize(execution.inputs?.homeSize || "");
    setHouseholdSize(execution.inputs?.householdSize || "");
    setCleaningFrequency(execution.inputs?.cleaningFrequency || "");
    setTimeAvailable(execution.inputs?.timeAvailable || "");
    setPriorities(execution.inputs?.priorities || "");
    setSpecialNeeds(execution.inputs?.specialNeeds || "");
    setPreferredDays(execution.inputs?.preferredDays || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="cleaning-schedule-generator"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cleaning Schedule Generator</h1>
              <p className="text-muted-foreground">
                Create personalized household cleaning schedules with task rotation and time management
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="homeType">Home Type *</Label>
                  <Select value={homeType} onValueChange={setHomeType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select home type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="small-house">Small house</SelectItem>
                      <SelectItem value="medium-house">Medium house</SelectItem>
                      <SelectItem value="large-house">Large house</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="homeSize">Home Size *</Label>
                  <Select value={homeSize} onValueChange={setHomeSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select home size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-bedroom">1 bedroom</SelectItem>
                      <SelectItem value="2-bedroom">2 bedrooms</SelectItem>
                      <SelectItem value="3-bedroom">3 bedrooms</SelectItem>
                      <SelectItem value="4-bedroom">4 bedrooms</SelectItem>
                      <SelectItem value="5+-bedroom">5+ bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Household & Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="householdSize">Household Size *</Label>
                  <Select value={householdSize} onValueChange={setHouseholdSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select household size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-person">1 person</SelectItem>
                      <SelectItem value="2-people">2 people</SelectItem>
                      <SelectItem value="3-4-people">3-4 people</SelectItem>
                      <SelectItem value="5+-people">5+ people</SelectItem>
                      <SelectItem value="kids-pets">Include kids/pets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cleaningFrequency">Cleaning Frequency *</Label>
                  <Select value={cleaningFrequency} onValueChange={setCleaningFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily-light">Daily light cleaning</SelectItem>
                      <SelectItem value="every-other-day">Every other day</SelectItem>
                      <SelectItem value="weekly">Weekly deep clean</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="mixed">Mixed schedule</SelectItem>
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
                Time Available *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={timeAvailable} onValueChange={setTimeAvailable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time available" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15-30-minutes">15-30 minutes per day</SelectItem>
                  <SelectItem value="30-60-minutes">30-60 minutes per day</SelectItem>
                  <SelectItem value="1-2-hours">1-2 hours per session</SelectItem>
                  <SelectItem value="weekend-blocks">Weekend time blocks</SelectItem>
                  <SelectItem value="flexible">Flexible schedule</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cleaning Priorities (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="priorities"
                  value={priorities}
                  onChange={(e) => setPriorities(e.target.value)}
                  placeholder="e.g., Kitchen and bathrooms first, guest areas important, focus on high-traffic areas..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferred Days (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  id="preferredDays"
                  value={preferredDays}
                  onChange={(e) => setPreferredDays(e.target.value)}
                  placeholder="e.g., Weekends, Tuesday/Thursday, avoid Mondays..."
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Special Needs or Constraints (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="specialNeeds"
                value={specialNeeds}
                onChange={(e) => setSpecialNeeds(e.target.value)}
                placeholder="e.g., Pet hair management, allergies, eco-friendly products only, physical limitations, busy work schedule..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !homeType.trim() || !homeSize.trim() || !householdSize.trim() || !cleaningFrequency.trim() || !timeAvailable.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Creating Schedule...
                </>
              ) : (
                "Generate Cleaning Schedule"
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
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in your home details above to create a personalized cleaning schedule.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}