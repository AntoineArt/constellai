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
import { Dumbbell, Target, Clock, Heart } from "lucide-react";

export default function ExercisePlanCreatorPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("exercise-plan-creator");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [goals, setGoals] = useState("");
  const [timeAvailable, setTimeAvailable] = useState("");
  const [exerciseType, setExerciseType] = useState("");
  const [equipment, setEquipment] = useState("");
  const [frequency, setFrequency] = useState("");
  const [limitations, setLimitations] = useState("");
  const [experience, setExperience] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/exercise-plan-creator",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { fitnessLevel, goals, timeAvailable, exerciseType, equipment, frequency, limitations, experience },
        outputs: { exercisePlan: message.content },
      });
    },
    onError: (error) => {
      console.error("Exercise plan creator error:", error);
    },
  });

  const handleGenerate = () => {
    if (!fitnessLevel.trim() || !goals.trim() || !timeAvailable.trim() || !exerciseType.trim() || !frequency.trim()) return;

    const newInputs = { fitnessLevel, goals, timeAvailable, exerciseType, equipment, frequency, limitations, experience };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        fitnessLevel: fitnessLevel.trim(),
        goals: goals.trim(),
        timeAvailable: timeAvailable.trim(),
        exerciseType: exerciseType.trim(),
        equipment: equipment.trim(),
        frequency: frequency.trim(),
        limitations: limitations.trim(),
        experience: experience.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setFitnessLevel("");
    setGoals("");
    setTimeAvailable("");
    setExerciseType("");
    setEquipment("");
    setFrequency("");
    setLimitations("");
    setExperience("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setFitnessLevel(execution.inputs?.fitnessLevel || "");
    setGoals(execution.inputs?.goals || "");
    setTimeAvailable(execution.inputs?.timeAvailable || "");
    setExerciseType(execution.inputs?.exerciseType || "");
    setEquipment(execution.inputs?.equipment || "");
    setFrequency(execution.inputs?.frequency || "");
    setLimitations(execution.inputs?.limitations || "");
    setExperience(execution.inputs?.experience || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="exercise-plan-creator"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Exercise Plan Creator</h1>
              <p className="text-muted-foreground">
                Generate personalized workout plans based on fitness goals and available time
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Fitness Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fitnessLevel">Current Fitness Level *</Label>
                  <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fitness level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (just starting)</SelectItem>
                      <SelectItem value="novice">Novice (some experience)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (regular exerciser)</SelectItem>
                      <SelectItem value="advanced">Advanced (experienced athlete)</SelectItem>
                      <SelectItem value="returning">Returning after break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience">Exercise Experience (Optional)</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never exercised regularly</SelectItem>
                      <SelectItem value="6-months">Less than 6 months</SelectItem>
                      <SelectItem value="1-year">6 months - 1 year</SelectItem>
                      <SelectItem value="2-years">1-2 years</SelectItem>
                      <SelectItem value="3-years">2-3 years</SelectItem>
                      <SelectItem value="5+ years">3+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goals & Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="frequency">Exercise Frequency *</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2x-week">2 times per week</SelectItem>
                      <SelectItem value="3x-week">3 times per week</SelectItem>
                      <SelectItem value="4x-week">4 times per week</SelectItem>
                      <SelectItem value="5x-week">5 times per week</SelectItem>
                      <SelectItem value="6x-week">6 times per week</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeAvailable">Time per Session *</Label>
                  <Select value={timeAvailable} onValueChange={setTimeAvailable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time available" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15-20">15-20 minutes</SelectItem>
                      <SelectItem value="20-30">20-30 minutes</SelectItem>
                      <SelectItem value="30-45">30-45 minutes</SelectItem>
                      <SelectItem value="45-60">45-60 minutes</SelectItem>
                      <SelectItem value="60-90">60-90 minutes</SelectItem>
                      <SelectItem value="90+">90+ minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Primary Fitness Goals *</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={goals} onValueChange={setGoals}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight-loss">Weight loss</SelectItem>
                  <SelectItem value="muscle-gain">Build muscle/strength</SelectItem>
                  <SelectItem value="endurance">Improve endurance</SelectItem>
                  <SelectItem value="general-fitness">General fitness</SelectItem>
                  <SelectItem value="tone-up">Tone and sculpt</SelectItem>
                  <SelectItem value="athletic-performance">Athletic performance</SelectItem>
                  <SelectItem value="flexibility">Flexibility and mobility</SelectItem>
                  <SelectItem value="health">Health and wellness</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Exercise Preferences *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={exerciseType} onValueChange={setExerciseType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exercise type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength-training">Strength training</SelectItem>
                    <SelectItem value="cardio">Cardio focused</SelectItem>
                    <SelectItem value="mixed">Mixed (strength + cardio)</SelectItem>
                    <SelectItem value="bodyweight">Bodyweight only</SelectItem>
                    <SelectItem value="hiit">HIIT workouts</SelectItem>
                    <SelectItem value="yoga-pilates">Yoga/Pilates</SelectItem>
                    <SelectItem value="sports-specific">Sports specific</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Equipment (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="equipment"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="e.g., Dumbbells, resistance bands, pull-up bar, treadmill, gym membership..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Physical Limitations or Injuries (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="limitations"
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
                placeholder="e.g., Bad knees, back issues, shoulder injury, joint problems..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !fitnessLevel.trim() || !goals.trim() || !timeAvailable.trim() || !exerciseType.trim() || !frequency.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Creating Exercise Plan...
                </>
              ) : (
                "Generate Exercise Plan"
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
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in your fitness details above to create a personalized exercise plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}