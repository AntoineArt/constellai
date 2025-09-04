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
import { Wallet, DollarSign, Target, PiggyBank } from "lucide-react";

export default function BudgetTrackerPage() {
  const { apiKey } = useApiKey();
  const { preferences } = usePreferences();
  const toolHistory = useToolHistory("budget-tracker");
  const [income, setIncome] = useState("");
  const [fixedExpenses, setFixedExpenses] = useState("");
  const [variableExpenses, setVariableExpenses] = useState("");
  const [goals, setGoals] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  const [debts, setDebts] = useState("");

  const { messages, isLoading, error, stop, reload } = useChat({
    api: "/api/budget-tracker",
    headers: {
      "x-api-key": apiKey || "",
    },
    onFinish: (message) => {
      toolHistory.updateCurrentExecution({
        inputs: { income, fixedExpenses, variableExpenses, goals, timeframe, currentSavings, debts },
        outputs: { budgetPlan: message.content },
      });
    },
    onError: (error) => {
      console.error("Budget tracker error:", error);
    },
  });

  const handleGenerate = () => {
    if (!income.trim() || !fixedExpenses.trim() || !goals.trim() || !timeframe.trim()) return;

    const newInputs = { income, fixedExpenses, variableExpenses, goals, timeframe, currentSavings, debts };
    toolHistory.updateCurrentExecution({ inputs: newInputs });

    reload({
      body: {
        income: income.trim(),
        fixedExpenses: fixedExpenses.trim(),
        variableExpenses: variableExpenses.trim(),
        goals: goals.trim(),
        timeframe: timeframe.trim(),
        currentSavings: currentSavings.trim(),
        debts: debts.trim(),
        model: preferences.defaultModel,
      },
    });
  };

  const clearForm = () => {
    setIncome("");
    setFixedExpenses("");
    setVariableExpenses("");
    setGoals("");
    setTimeframe("");
    setCurrentSavings("");
    setDebts("");
    toolHistory.clearActiveExecution();
  };

  const loadExecution = (execution: any) => {
    setIncome(execution.inputs?.income || "");
    setFixedExpenses(execution.inputs?.fixedExpenses || "");
    setVariableExpenses(execution.inputs?.variableExpenses || "");
    setGoals(execution.inputs?.goals || "");
    setTimeframe(execution.inputs?.timeframe || "");
    setCurrentSavings(execution.inputs?.currentSavings || "");
    setDebts(execution.inputs?.debts || "");
  };

  return (
    <div className="flex h-screen">
      <ToolHistorySidebar
        toolId="budget-tracker"
        onLoadExecution={loadExecution}
        onNewExecution={clearForm}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Budget Tracker</h1>
              <p className="text-muted-foreground">
                Create personal budget tracking systems with financial goal planning
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Income & Fixed Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="income">Monthly Income *</Label>
                  <Input
                    id="income"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="e.g., $5,000 after taxes"
                  />
                </div>
                <div>
                  <Label htmlFor="fixedExpenses">Fixed Monthly Expenses *</Label>
                  <Textarea
                    id="fixedExpenses"
                    value={fixedExpenses}
                    onChange={(e) => setFixedExpenses(e.target.value)}
                    placeholder="e.g., Rent: $1,200, Car payment: $300, Insurance: $150..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goals & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="goals">Financial Goals *</Label>
                  <Textarea
                    id="goals"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="e.g., Emergency fund: $10,000, Vacation: $3,000, New car: $20,000..."
                    rows={3}
                  />
                </div>
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
                      <SelectItem value="2 years">2 years</SelectItem>
                      <SelectItem value="5+ years">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Variable Expenses (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="variableExpenses"
                  value={variableExpenses}
                  onChange={(e) => setVariableExpenses(e.target.value)}
                  placeholder="e.g., Groceries: $400, Entertainment: $200..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4" />
                  Current Savings (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  id="currentSavings"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  placeholder="e.g., $5,000"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Debts (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="debts"
                  value={debts}
                  onChange={(e) => setDebts(e.target.value)}
                  placeholder="e.g., Credit card: $2,000, Student loan: $15,000..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleGenerate}
              disabled={!apiKey || isLoading || !income.trim() || !fixedExpenses.trim() || !goals.trim() || !timeframe.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2" />
                  Creating Budget Plan...
                </>
              ) : (
                "Generate Budget Tracker"
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
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in your financial details above to create a personalized budget tracker.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}