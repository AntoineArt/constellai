"use client";

import { useId, useState } from "react";
import { Key, Settings, Thermometer } from "lucide-react";

import { useApiKey } from "@/hooks/use-api-key";
import { AI_MODELS } from "@/lib/models";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface TopBarProps {
  title: string;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  temperature?: number;
  onTemperatureChange?: (temperature: number) => void;
  actions?: React.ReactNode;
}

export function TopBar({
  title,
  selectedModel,
  onModelChange,
  temperature = 0.7,
  onTemperatureChange,
  actions,
}: TopBarProps) {
  const { apiKey, setApiKey, getMaskedApiKey, hasApiKey } = useApiKey();
  const [tempApiKey, setTempApiKey] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  const temperatureId = useId();
  const apiKeyId = useId();

  const validateApiKey = async (key: string) => {
    if (!key.trim()) {
      setValidationError("API key cannot be empty");
      return false;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      // Test the API key with a simple request
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "test" }],
          model: AI_MODELS[0].id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setValidationError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
        return false;
      }

      setValidationSuccess(true);
      setTimeout(() => setValidationSuccess(false), 2000);
      return true;
    } catch {
      setValidationError("Network error: Unable to validate API key");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveApiKey = async () => {
    const isValid = await validateApiKey(tempApiKey);
    if (isValid) {
      setApiKey(tempApiKey);
      setTempApiKey("");
      setIsDialogOpen(false);
      setValidationError(null);

      // Refresh the page after successfully setting API key
      window.location.reload();
    }
  };

  const handleOpenDialog = () => {
    setTempApiKey(apiKey);
    setValidationError(null);
    setValidationSuccess(false);
    setIsDialogOpen(true);
  };

  return (
    <div className="h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between gap-2 sm:gap-3 overflow-hidden">
        <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate min-w-0">{title}</h1>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0 flex-wrap">
          {selectedModel && onModelChange && (
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="w-[140px] sm:w-[160px] md:w-[180px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onTemperatureChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 px-2.5">
                  <Thermometer className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{temperature.toFixed(1)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={temperatureId}>Temperature</Label>
                      <span className="text-sm text-muted-foreground font-mono">
                        {temperature.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      id={temperatureId}
                      min={0}
                      max={2}
                      step={0.1}
                      value={[temperature]}
                      onValueChange={(value) =>
                        onTemperatureChange(value[0])
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower values make output more focused and deterministic.
                      Higher values increase creativity and randomness.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {actions}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDialog}
                className={`h-8 w-8 p-0 ${hasApiKey ? "text-green-600 border-green-600/30 bg-green-50 dark:bg-green-950" : ""}`}
                title={hasApiKey ? "API key configured" : "Set API key"}
              >
                <Key className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Vercel AI Gateway API Key
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor={apiKeyId}>API Key</Label>
                  <Input
                    id={apiKeyId}
                    type="password"
                    placeholder="Enter your Vercel AI Gateway API key..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your API key is stored locally and never sent to our
                    servers.
                  </p>

                  {/* Validation feedback */}
                  {validationError && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      {validationError}
                    </div>
                  )}

                  {validationSuccess && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      ✓ API key is valid and working!
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTempApiKey("");
                      setIsDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveApiKey}
                    disabled={isValidating}
                  >
                    {isValidating ? "Validating..." : "Save"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
