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
import { Plane, MapPin, Users, DollarSign } from "lucide-react";

export default function TravelItineraryPlannerPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("travel-itinerary-planner");
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [travelers, setTravelers] = useState("");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [transportation, setTransportation] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/travel-itinerary-planner",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { destination, duration, travelers, budget, interests, travelStyle, accommodation, transportation },
        outputs: { itinerary: message.content },
      });
    },
    onError: (error) => {
      console.error("Travel itinerary planner error:", error);
    },
  });

  const handleGenerate = () => {
    if (!destination.trim() || !duration.trim() || !travelers.trim() || !budget.trim() || !interests.trim() || !travelStyle.trim()) return;

    const newInputs = { destination, duration, travelers, budget, interests, travelStyle, accommodation, transportation };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        destination: destination.trim(),
        duration: duration.trim(),
        travelers: travelers.trim(),
        budget: budget.trim(),
        interests: interests.trim(),
        travelStyle: travelStyle.trim(),
        accommodation: accommodation.trim(),
        transportation: transportation.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setDestination("");
    setDuration("");
    setTravelers("");
    setBudget("");
    setInterests("");
    setTravelStyle("");
    setAccommodation("");
    setTransportation("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setDestination(execution.inputs?.destination || "");
    setDuration(execution.inputs?.duration || "");
    setTravelers(execution.inputs?.travelers || "");
    setBudget(execution.inputs?.budget || "");
    setInterests(execution.inputs?.interests || "");
    setTravelStyle(execution.inputs?.travelStyle || "");
    setAccommodation(execution.inputs?.accommodation || "");
    setTransportation(execution.inputs?.transportation || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="travel-itinerary-planner"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plane className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Travel Itinerary Planner</h1>
              <p className="text-muted-foreground">
                Generate detailed travel plans with activities and budget considerations
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Destination & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="destination">Destination *</Label>
                  <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g., Paris, France or Tokyo, Japan"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Trip Duration *</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-3 days">2-3 days (Weekend)</SelectItem>
                      <SelectItem value="4-5 days">4-5 days (Long weekend)</SelectItem>
                      <SelectItem value="1 week">1 week</SelectItem>
                      <SelectItem value="10 days">10 days</SelectItem>
                      <SelectItem value="2 weeks">2 weeks</SelectItem>
                      <SelectItem value="3+ weeks">3+ weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Group & Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="travelers">Number of Travelers *</Label>
                  <Select value={travelers} onValueChange={setTravelers}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select travelers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Solo traveler</SelectItem>
                      <SelectItem value="2">Couple</SelectItem>
                      <SelectItem value="3-4">Small group (3-4)</SelectItem>
                      <SelectItem value="5-8">Large group (5-8)</SelectItem>
                      <SelectItem value="family-kids">Family with kids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budget">Budget Level *</Label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget traveler</SelectItem>
                      <SelectItem value="mid-range">Mid-range</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="mixed">Mixed (budget + splurges)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Travel Style & Preferences *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="travelStyle">Travel Style *</Label>
                <Select value={travelStyle} onValueChange={setTravelStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select travel style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relaxed">Relaxed & leisurely</SelectItem>
                    <SelectItem value="adventure">Adventure & active</SelectItem>
                    <SelectItem value="cultural">Cultural & historical</SelectItem>
                    <SelectItem value="foodie">Food & culinary focused</SelectItem>
                    <SelectItem value="nightlife">Nightlife & entertainment</SelectItem>
                    <SelectItem value="nature">Nature & outdoors</SelectItem>
                    <SelectItem value="mixed">Mixed activities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="interests">Interests & Activities *</Label>
                <Textarea
                  id="interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g., Museums, hiking, local food, shopping, beaches, art galleries, historical sites..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Accommodation Preference (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={accommodation} onValueChange={setAccommodation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select accommodation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Hotels</SelectItem>
                    <SelectItem value="hostel">Hostels</SelectItem>
                    <SelectItem value="airbnb">Airbnb/Vacation rentals</SelectItem>
                    <SelectItem value="boutique">Boutique properties</SelectItem>
                    <SelectItem value="resort">Resorts</SelectItem>
                    <SelectItem value="mixed">Mixed options</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transportation (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={transportation} onValueChange={setTransportation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transportation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public-transport">Public transportation</SelectItem>
                    <SelectItem value="rental-car">Rental car</SelectItem>
                    <SelectItem value="ride-share">Ride-share/Taxis</SelectItem>
                    <SelectItem value="walking-biking">Walking & biking</SelectItem>
                    <SelectItem value="mixed">Mixed transportation</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !destination.trim() || !duration.trim() || !travelers.trim() || !budget.trim() || !interests.trim() || !travelStyle.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Planning Itinerary...
                </>
              ) : (
                "Generate Travel Itinerary"
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
              <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in your travel details above to generate a personalized itinerary.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}