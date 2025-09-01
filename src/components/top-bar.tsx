"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiKey } from "@/hooks/use-api-key";
import { AI_MODELS } from "@/lib/models";
import { Key, Settings } from "lucide-react";

interface TopBarProps {
  title: string;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  actions?: React.ReactNode;
}

export function TopBar({
  title,
  selectedModel,
  onModelChange,
  actions,
}: TopBarProps) {
  const { apiKey, setApiKey, getMaskedApiKey, hasApiKey } = useApiKey();
  const [tempApiKey, setTempApiKey] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

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
    } catch (error) {
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
    <div className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        <h1 className="text-xl font-semibold">{title}</h1>

        <div className="flex items-center gap-4">
          {selectedModel && onModelChange && (
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="w-[200px]">
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
          {actions}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDialog}
                className="gap-2"
              >
                <Key className="h-4 w-4" />
                {hasApiKey ? getMaskedApiKey() : "Set API Key"}
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
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
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
