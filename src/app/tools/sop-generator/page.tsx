"use client";

import { useState, useCallback, useRef, useEffect, useId } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Loader2, Send, Copy, Check } from "lucide-react";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { TOOL_IDS } from "@/lib/storage/storage-keys";
import { cn } from "@/lib/utils";

export default function SopGenerator() {
  const [procedureDescription, setProcedureDescription] = useState("");
  const [procedureType, setProcedureType] = useState("");
  const [department, setDepartment] = useState("");
  const [currentProcedure, setCurrentProcedure] = useState("");
  const [includeSafetyNotes, setIncludeSafetyNotes] = useState(true);
  const [includeQualityChecks, setIncludeQualityChecks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const procedureDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const currentProcedureRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const departmentId = useId();
  const currentProcedureId = useId();
  const safetyNotesId = useId();
  const qualityChecksId = useId();

  const { addToHistory, getHistory } = useToolHistory(TOOL_IDS.SOP_GENERATOR);
  const { getApiKey } = usePreferences();

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      const lastExecution = history[0];
      setProcedureDescription(lastExecution.inputs.procedureDescription || "");
      setProcedureType(lastExecution.inputs.procedureType || "");
      setDepartment(lastExecution.inputs.department || "");
      setCurrentProcedure(lastExecution.inputs.currentProcedure || "");
      setIncludeSafetyNotes(lastExecution.inputs.includeSafetyNotes ?? true);
      setIncludeQualityChecks(
        lastExecution.inputs.includeQualityChecks ?? false
      );
      setResult(lastExecution.output || "");
    }
  }, [getHistory]);

  useEffect(() => {
    if (procedureDescriptionRef.current) {
      procedureDescriptionRef.current.style.height = "auto";
      procedureDescriptionRef.current.style.height = `${procedureDescriptionRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (currentProcedureRef.current) {
      currentProcedureRef.current.style.height = "auto";
      currentProcedureRef.current.style.height = `${currentProcedureRef.current.scrollHeight}px`;
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!procedureDescription) return;

    setIsLoading(true);
    setResult("");
    setCopied(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        alert("Please set your API key in settings");
        return;
      }

      const response = await fetch("/api/sop-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          procedureDescription,
          procedureType,
          department,
          currentProcedure,
          includeSafetyNotes,
          includeQualityChecks,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let accumulatedResult = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedResult += chunk;
        setResult(accumulatedResult);
      }

      addToHistory({
        inputs: {
          procedureDescription,
          procedureType,
          department,
          currentProcedure,
          includeSafetyNotes,
          includeQualityChecks,
        },
        output: accumulatedResult,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error generating SOP:", error);
        setResult("Error generating SOP. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    procedureDescription,
    procedureType,
    department,
    currentProcedure,
    includeSafetyNotes,
    includeQualityChecks,
    getApiKey,
    addToHistory,
  ]);

  const handleCopy = useCallback(async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SOP Generator</h1>
        <p className="text-muted-foreground">
          Generate standard operating procedures.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate SOP
            </CardTitle>
            <CardDescription>
              Create comprehensive standard operating procedures for your
              organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={inputId}>Procedure Description</Label>
              <Textarea
                ref={procedureDescriptionRef}
                id={inputId}
                value={procedureDescription}
                onChange={(e) => setProcedureDescription(e.target.value)}
                placeholder="Describe the procedure you need an SOP for..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Procedure Type</Label>
              <Select value={procedureType} onValueChange={setProcedureType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select procedure type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">
                    Operational Procedure
                  </SelectItem>
                  <SelectItem value="safety">Safety Procedure</SelectItem>
                  <SelectItem value="quality">
                    Quality Control Procedure
                  </SelectItem>
                  <SelectItem value="maintenance">
                    Maintenance Procedure
                  </SelectItem>
                  <SelectItem value="administrative">
                    Administrative Procedure
                  </SelectItem>
                  <SelectItem value="emergency">Emergency Procedure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={departmentId}>Department/Team</Label>
              <Input
                id={departmentId}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Production, IT, HR, Customer Service"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={currentProcedureId}>
                Current Procedure (Optional)
              </Label>
              <Textarea
                ref={currentProcedureRef}
                id={currentProcedureId}
                value={currentProcedure}
                onChange={(e) => setCurrentProcedure(e.target.value)}
                placeholder="Describe the current procedure if it exists..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={safetyNotesId}
                  checked={includeSafetyNotes}
                  onCheckedChange={(checked) =>
                    setIncludeSafetyNotes(checked as boolean)
                  }
                />
                <Label htmlFor={safetyNotesId}>Include Safety Notes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={qualityChecksId}
                  checked={includeQualityChecks}
                  onCheckedChange={(checked) =>
                    setIncludeQualityChecks(checked as boolean)
                  }
                />
                <Label htmlFor={qualityChecksId}>Include Quality Checks</Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !procedureDescription}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating SOP...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate SOP
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Standard Operating Procedure</CardTitle>
            <CardDescription>
              Your comprehensive SOP will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div
                  className={cn(
                    "prose prose-sm max-w-none",
                    "bg-muted/50 rounded-lg p-4",
                    "whitespace-pre-wrap"
                  )}
                >
                  {result}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fill in the form and click "Generate SOP" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
