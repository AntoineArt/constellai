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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader } from "@/components/ai-elements/loader";
import { Message } from "@/components/ai-elements/message";
import { useApiKey } from "@/hooks/use-api-key";
import { useToolHistory } from "@/lib/storage/hooks/use-tool-history";
import { usePreferences } from "@/lib/storage/hooks/use-preferences";
import { ToolHistorySidebar } from "@/components/tool-history-sidebar";
import { UtensilsCrossed, Users, Clock, DollarSign } from "lucide-react";

export default function MealPlanGeneratorPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("meal-plan-generator");
  const [duration, setDuration] = useState("");
  const [people, setPeople] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [cuisinePreferences, setCuisinePreferences] = useState("");
  const [mealTypes, setMealTypes] = useState("");
  const [budget, setBudget] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [shoppingList, setShoppingList] = useState(false);

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/meal-plan-generator",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { duration, people, dietaryRestrictions, cuisinePreferences, mealTypes, budget, cookingTime, shoppingList },
        outputs: { mealPlan: message.content },
      });
    },
    onError: (error) => {
      console.error("Meal plan generator error:", error);
    },
  });

  const handleGenerate = () => {
    if (!duration.trim() || !people.trim() || !mealTypes.trim() || !budget.trim() || !cookingTime.trim()) return;

    const newInputs = { duration, people, dietaryRestrictions, cuisinePreferences, mealTypes, budget, cookingTime, shoppingList };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        duration: duration.trim(),
        people: people.trim(),
        dietaryRestrictions: dietaryRestrictions.trim(),
        cuisinePreferences: cuisinePreferences.trim(),
        mealTypes: mealTypes.trim(),
        budget: budget.trim(),
        cookingTime: cookingTime.trim(),
        shoppingList,
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setDuration("");
    setPeople("");
    setDietaryRestrictions("");
    setCuisinePreferences("");
    setMealTypes("");
    setBudget("");
    setCookingTime("");
    setShoppingList(false);
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setDuration(execution.inputs?.duration || "");
    setPeople(execution.inputs?.people || "");
    setDietaryRestrictions(execution.inputs?.dietaryRestrictions || "");
    setCuisinePreferences(execution.inputs?.cuisinePreferences || "");
    setMealTypes(execution.inputs?.mealTypes || "");
    setBudget(execution.inputs?.budget || "");
    setCookingTime(execution.inputs?.cookingTime || "");
    setShoppingList(execution.inputs?.shoppingList || false);
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="meal-plan-generator"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Meal Plan Generator</h1>
              <p className="text-muted-foreground">
                Create weekly meal plans with shopping lists and nutritional guidance
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Planning Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="duration">Planning Duration *</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3 days">3 days</SelectItem>
                      <SelectItem value="1 week">1 week</SelectItem>
                      <SelectItem value="2 weeks">2 weeks</SelectItem>
                      <SelectItem value="1 month">1 month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="people">Number of People *</Label>
                  <Select value={people} onValueChange={setPeople}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of people" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 person</SelectItem>
                      <SelectItem value="2">2 people</SelectItem>
                      <SelectItem value="3-4">3-4 people</SelectItem>
                      <SelectItem value="5-6">5-6 people</SelectItem>
                      <SelectItem value="7+">7+ people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Preferences & Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="budget">Budget Level *</Label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tight">Tight budget</SelectItem>
                      <SelectItem value="moderate">Moderate budget</SelectItem>
                      <SelectItem value="flexible">Flexible budget</SelectItem>
                      <SelectItem value="premium">Premium budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cookingTime">Available Cooking Time *</Label>
                  <Select value={cookingTime} onValueChange={setCookingTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cooking time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15-30 minutes">15-30 minutes</SelectItem>
                      <SelectItem value="30-45 minutes">30-45 minutes</SelectItem>
                      <SelectItem value="45-60 minutes">45-60 minutes</SelectItem>
                      <SelectItem value="60+ minutes">60+ minutes</SelectItem>
                      <SelectItem value="meal-prep">Meal prep sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Meal Types *</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={mealTypes} onValueChange={setMealTypes}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meal types to include" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast-lunch-dinner">Breakfast, Lunch & Dinner</SelectItem>
                  <SelectItem value="lunch-dinner">Lunch & Dinner only</SelectItem>
                  <SelectItem value="dinner-only">Dinner only</SelectItem>
                  <SelectItem value="all-meals-snacks">All meals + Snacks</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dietary Restrictions (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="dietaryRestrictions"
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  placeholder="e.g., Vegetarian, gluten-free, dairy-free, nut allergies, low-sodium..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cuisine Preferences (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="cuisinePreferences"
                  value={cuisinePreferences}
                  onChange={(e) => setCuisinePreferences(e.target.value)}
                  placeholder="e.g., Italian, Asian, Mediterranean, comfort food, healthy, international..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="shoppingList" 
                  checked={shoppingList} 
                  onCheckedChange={setShoppingList}
                />
                <Label htmlFor="shoppingList" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Include organized shopping list
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !duration.trim() || !people.trim() || !mealTypes.trim() || !budget.trim() || !cookingTime.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Generating Meal Plan...
                </>
              ) : (
                "Generate Meal Plan"
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
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in your preferences above to generate a personalized meal plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}