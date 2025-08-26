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
import { useApiKey } from "@/hooks/use-api-key";
import { Key, Settings } from "lucide-react";

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, actions }: TopBarProps) {
  const { apiKey, setApiKey, getMaskedApiKey, hasApiKey } = useApiKey();
  const [tempApiKey, setTempApiKey] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey);
    setTempApiKey("");
    setIsDialogOpen(false);
  };

  const handleOpenDialog = () => {
    setTempApiKey(apiKey);
    setIsDialogOpen(true);
  };

  return (
    <div className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        <h1 className="text-xl font-semibold">{title}</h1>

        <div className="flex items-center gap-4">
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
                  <Button size="sm" onClick={handleSaveApiKey}>
                    Save
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
