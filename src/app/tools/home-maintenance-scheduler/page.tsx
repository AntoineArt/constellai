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
import { Home, Calendar, Wrench, AlertCircle } from "lucide-react";

export default function HomeMaintenanceSchedulerPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("home-maintenance-scheduler");
  const [homeType, setHomeType] = useState("");
  const [homeAge, setHomeAge] = useState("");
  const [priority, setPriority] = useState("");
  const [season, setSeason] = useState("");
  const [existingSystems, setExistingSystems] = useState("");
  const [previousMaintenance, setPreviousMaintenance] = useState("");
  const [budget, setBudget] = useState("");
  const [timeframe, setTimeframe] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/home-maintenance-scheduler",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { homeType, homeAge, priority, season, existingSystems, previousMaintenance, budget, timeframe },
        outputs: { schedule: message.content },
      });
    },
    onError: (error) => {
      console.error("Home maintenance scheduler error:", error);
    },
  });

  const handleGenerate = () => {
    if (!homeType.trim() || !homeAge.trim() || !priority.trim() || !timeframe.trim()) return;

    const newInputs = { homeType, homeAge, priority, season, existingSystems, previousMaintenance, budget, timeframe };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        homeType: homeType.trim(),
        homeAge: homeAge.trim(),
        priority: priority.trim(),
        season: season.trim(),
        existingSystems: existingSystems.trim(),
        previousMaintenance: previousMaintenance.trim(),
        budget: budget.trim(),
        timeframe: timeframe.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setHomeType("");
    setHomeAge("");
    setPriority("");
    setSeason("");
    setExistingSystems("");
    setPreviousMaintenance("");
    setBudget("");
    setTimeframe("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setHomeType(execution.inputs?.homeType || "");
    setHomeAge(execution.inputs?.homeAge || "");
    setPriority(execution.inputs?.priority || "");
    setSeason(execution.inputs?.season || "");
    setExistingSystems(execution.inputs?.existingSystems || "");
    setPreviousMaintenance(execution.inputs?.previousMaintenance || "");
    setBudget(execution.inputs?.budget || "");
    setTimeframe(execution.inputs?.timeframe || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="home-maintenance-scheduler"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Home Maintenance Scheduler</h1>
              <p className="text-muted-foreground">
                Generate comprehensive home maintenance schedules with seasonal priorities
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
                      <SelectItem value="single-family">Single-family house</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="condo">Condominium</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="mobile-home">Mobile home</SelectItem>
                      <SelectItem value="historic">Historic home</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="homeAge">Home Age *</Label>
                  <Select value={homeAge} onValueChange={setHomeAge}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select home age" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-0-5">New (0-5 years)</SelectItem>
                      <SelectItem value="recent-5-15">Recent (5-15 years)</SelectItem>
                      <SelectItem value="established-15-30">Established (15-30 years)</SelectItem>
                      <SelectItem value="mature-30-50">Mature (30-50 years)</SelectItem>
                      <SelectItem value="vintage-50+">Vintage (50+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="timeframe">Planning Timeframe *</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3 months">3 months</SelectItem>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="1 year">1 year</SelectItem>
                      <SelectItem value="5 years">5-year plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="season">Current Season (Optional)</Label>
                  <Select value={season} onValueChange={setSeason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="winter">Winter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Maintenance Priority *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority focus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventive maintenance</SelectItem>
                  <SelectItem value="safety">Safety and security</SelectItem>
                  <SelectItem value="energy-efficiency">Energy efficiency</SelectItem>
                  <SelectItem value="curb-appeal">Curb appeal and aesthetics</SelectItem>
                  <SelectItem value="urgent-repairs">Urgent repairs first</SelectItem>
                  <SelectItem value="seasonal">Seasonal priorities</SelectItem>
                  <SelectItem value="balanced">Balanced approach</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Existing Systems (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="existingSystems"
                  value={existingSystems}
                  onChange={(e) => setExistingSystems(e.target.value)}
                  placeholder="e.g., HVAC system, roof type, plumbing age, electrical panel..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Range (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={budget} onValueChange={setBudget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal ($0-500/year)</SelectItem>
                    <SelectItem value="moderate">Moderate ($500-2000/year)</SelectItem>
                    <SelectItem value="substantial">Substantial ($2000-5000/year)</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive ($5000+/year)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Maintenance History (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="previousMaintenance"
                value={previousMaintenance}
                onChange={(e) => setPreviousMaintenance(e.target.value)}
                placeholder="e.g., New roof 2 years ago, HVAC serviced last spring, painted exterior last summer..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !homeType.trim() || !homeAge.trim() || !priority.trim() || !timeframe.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Creating Schedule...
                </>
              ) : (
                "Generate Maintenance Schedule"
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
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in your home details above to generate a personalized maintenance schedule.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}