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
import { Calendar, Users, MapPin, DollarSign } from "lucide-react";

export default function EventPlannerPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("event-planner");
  const [eventType, setEventType] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [venue, setVenue] = useState("");
  const [theme, setTheme] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [timeline, setTimeline] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/event-planner",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { eventType, guestCount, budget, duration, venue, theme, specialRequests, timeline },
        outputs: { eventPlan: message.content },
      });
    },
    onError: (error) => {
      console.error("Event planner error:", error);
    },
  });

  const handleGenerate = () => {
    if (!eventType.trim() || !guestCount.trim() || !budget.trim() || !duration.trim() || !timeline.trim()) return;

    const newInputs = { eventType, guestCount, budget, duration, venue, theme, specialRequests, timeline };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        eventType: eventType.trim(),
        guestCount: guestCount.trim(),
        budget: budget.trim(),
        duration: duration.trim(),
        venue: venue.trim(),
        theme: theme.trim(),
        specialRequests: specialRequests.trim(),
        timeline: timeline.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setEventType("");
    setGuestCount("");
    setBudget("");
    setDuration("");
    setVenue("");
    setTheme("");
    setSpecialRequests("");
    setTimeline("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setEventType(execution.inputs?.eventType || "");
    setGuestCount(execution.inputs?.guestCount || "");
    setBudget(execution.inputs?.budget || "");
    setDuration(execution.inputs?.duration || "");
    setVenue(execution.inputs?.venue || "");
    setTheme(execution.inputs?.theme || "");
    setSpecialRequests(execution.inputs?.specialRequests || "");
    setTimeline(execution.inputs?.timeline || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="event-planner"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Event Planner</h1>
              <p className="text-muted-foreground">
                Generate comprehensive event plans with timelines and vendor recommendations
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="birthday-party">Birthday party</SelectItem>
                      <SelectItem value="anniversary">Anniversary celebration</SelectItem>
                      <SelectItem value="graduation">Graduation party</SelectItem>
                      <SelectItem value="baby-shower">Baby shower</SelectItem>
                      <SelectItem value="corporate-event">Corporate event</SelectItem>
                      <SelectItem value="holiday-party">Holiday party</SelectItem>
                      <SelectItem value="fundraiser">Fundraiser</SelectItem>
                      <SelectItem value="reunion">Family/School reunion</SelectItem>
                      <SelectItem value="dinner-party">Dinner party</SelectItem>
                      <SelectItem value="other">Other celebration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Event Duration *</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-3 hours">2-3 hours</SelectItem>
                      <SelectItem value="4-5 hours">4-5 hours</SelectItem>
                      <SelectItem value="6-8 hours">6-8 hours (full day)</SelectItem>
                      <SelectItem value="full-weekend">Full weekend</SelectItem>
                      <SelectItem value="multi-day">Multi-day event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Guest & Budget Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="guestCount">Expected Guest Count *</Label>
                  <Select value={guestCount} onValueChange={setGuestCount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select guest count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intimate-10">Intimate (5-10 guests)</SelectItem>
                      <SelectItem value="small-25">Small (10-25 guests)</SelectItem>
                      <SelectItem value="medium-50">Medium (25-50 guests)</SelectItem>
                      <SelectItem value="large-100">Large (50-100 guests)</SelectItem>
                      <SelectItem value="very-large-150">Very large (100-150 guests)</SelectItem>
                      <SelectItem value="massive-200+">Massive (150+ guests)</SelectItem>
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
                      <SelectItem value="under-500">Under $500</SelectItem>
                      <SelectItem value="500-1500">$500 - $1,500</SelectItem>
                      <SelectItem value="1500-5000">$1,500 - $5,000</SelectItem>
                      <SelectItem value="5000-15000">$5,000 - $15,000</SelectItem>
                      <SelectItem value="15000-50000">$15,000 - $50,000</SelectItem>
                      <SelectItem value="50000+">$50,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Planning Timeline *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select planning timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                  <SelectItem value="1 month">1 month</SelectItem>
                  <SelectItem value="2-3 months">2-3 months</SelectItem>
                  <SelectItem value="6 months">6 months</SelectItem>
                  <SelectItem value="1 year">1 year or more</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Venue Preference (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={venue} onValueChange={setVenue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home/Backyard</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="banquet-hall">Banquet hall</SelectItem>
                    <SelectItem value="outdoor-venue">Outdoor venue</SelectItem>
                    <SelectItem value="hotel">Hotel/Resort</SelectItem>
                    <SelectItem value="community-center">Community center</SelectItem>
                    <SelectItem value="unique-venue">Unique venue</SelectItem>
                    <SelectItem value="undecided">Need recommendations</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theme/Style (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., Rustic, elegant, tropical, vintage, modern..."
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Special Requirements & Preferences (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="specialRequests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g., Dietary restrictions, accessibility needs, entertainment preferences, cultural considerations..."
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !eventType.trim() || !guestCount.trim() || !budget.trim() || !duration.trim() || !timeline.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Creating Event Plan...
                </>
              ) : (
                "Generate Event Plan"
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
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in your event details above to create a comprehensive event plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}