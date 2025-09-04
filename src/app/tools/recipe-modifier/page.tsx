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
import { ChefHat, Users, Clock, Heart } from "lucide-react";

export default function RecipeModifierPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("recipe-modifier");
  const [originalRecipe, setOriginalRecipe] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [modificationType, setModificationType] = useState("");
  const [healthGoals, setHealthGoals] = useState("");
  const [availableIngredients, setAvailableIngredients] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/recipe-modifier",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { originalRecipe, servingSize, dietaryRestrictions, modificationType, healthGoals, availableIngredients, cookingTime, skillLevel },
        outputs: { modifiedRecipe: message.content },
      });
    },
    onError: (error) => {
      console.error("Recipe modifier error:", error);
    },
  });

  const handleGenerate = () => {
    if (!originalRecipe.trim() || !modificationType.trim()) return;

    const newInputs = { originalRecipe, servingSize, dietaryRestrictions, modificationType, healthGoals, availableIngredients, cookingTime, skillLevel };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        originalRecipe: originalRecipe.trim(),
        servingSize: servingSize.trim(),
        dietaryRestrictions: dietaryRestrictions.trim(),
        modificationType: modificationType.trim(),
        healthGoals: healthGoals.trim(),
        availableIngredients: availableIngredients.trim(),
        cookingTime: cookingTime.trim(),
        skillLevel: skillLevel.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setOriginalRecipe("");
    setServingSize("");
    setDietaryRestrictions("");
    setModificationType("");
    setHealthGoals("");
    setAvailableIngredients("");
    setCookingTime("");
    setSkillLevel("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setOriginalRecipe(execution.inputs?.originalRecipe || "");
    setServingSize(execution.inputs?.servingSize || "");
    setDietaryRestrictions(execution.inputs?.dietaryRestrictions || "");
    setModificationType(execution.inputs?.modificationType || "");
    setHealthGoals(execution.inputs?.healthGoals || "");
    setAvailableIngredients(execution.inputs?.availableIngredients || "");
    setCookingTime(execution.inputs?.cookingTime || "");
    setSkillLevel(execution.inputs?.skillLevel || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="recipe-modifier"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recipe Modifier</h1>
              <p className="text-muted-foreground">
                Adapt recipes for dietary restrictions and adjust serving sizes with ingredient substitutions
              </p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Original Recipe *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="originalRecipe"
                value={originalRecipe}
                onChange={(e) => setOriginalRecipe(e.target.value)}
                placeholder="Paste your recipe here (ingredients, instructions, serving size)..."
                rows={8}
                className="resize-none"
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Modification Type *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="modificationType">What to Modify</Label>
                  <Select value={modificationType} onValueChange={setModificationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select modification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dietary-restrictions">Dietary restrictions</SelectItem>
                      <SelectItem value="serving-size">Serving size</SelectItem>
                      <SelectItem value="healthier-version">Make healthier</SelectItem>
                      <SelectItem value="ingredient-substitution">Ingredient substitution</SelectItem>
                      <SelectItem value="cooking-method">Cooking method</SelectItem>
                      <SelectItem value="skill-level">Simplify/complexity</SelectItem>
                      <SelectItem value="multiple-changes">Multiple changes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="servingSize">New Serving Size (Optional)</Label>
                  <Input
                    id="servingSize"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    placeholder="e.g., 6 servings, 2 people, 12 portions"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="skillLevel">Cooking Skill Level (Optional)</Label>
                  <Select value={skillLevel} onValueChange={setSkillLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (simple)</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="simplify">Simplify current recipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cookingTime">Preferred Cooking Time (Optional)</Label>
                  <Select value={cookingTime} onValueChange={setCookingTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15-minutes">Under 15 minutes</SelectItem>
                      <SelectItem value="30-minutes">Under 30 minutes</SelectItem>
                      <SelectItem value="1-hour">Under 1 hour</SelectItem>
                      <SelectItem value="no-preference">No preference</SelectItem>
                      <SelectItem value="slow-cook">Slow cooking OK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  placeholder="e.g., Gluten-free, dairy-free, vegan, keto, low-sodium, nut allergies..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Health Goals (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="healthGoals"
                  value={healthGoals}
                  onChange={(e) => setHealthGoals(e.target.value)}
                  placeholder="e.g., Lower calories, higher protein, reduce sugar, add more vegetables..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Available Ingredients or Substitutions (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="availableIngredients"
                value={availableIngredients}
                onChange={(e) => setAvailableIngredients(e.target.value)}
                placeholder="e.g., I have chicken but no beef, prefer coconut milk instead of dairy, need to use up leftover vegetables..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !originalRecipe.trim() || !modificationType.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Modifying Recipe...
                </>
              ) : (
                "Modify Recipe"
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
              <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Paste your recipe above and select how you'd like to modify it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}