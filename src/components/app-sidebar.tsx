"use client";

import {
  ChevronDown,
  ChevronRight,
  Home,
  Key,
  Pin,
  PinOff,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useApiKey } from "@/hooks/use-api-key";
import { usePinnedTools } from "@/lib/storage";
import { AI_MODELS } from "@/lib/models";
import { tools } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const { pinnedTools, toggle, isPinned, isLoaded } = usePinnedTools();
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const { apiKey, setApiKey, hasApiKey } = useApiKey();
  const [tempApiKey, setTempApiKey] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);
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
      window.location.reload();
    }
  };

  const handleOpenDialog = () => {
    setTempApiKey(apiKey);
    setValidationError(null);
    setValidationSuccess(false);
    setIsDialogOpen(true);
  };

  // Get current tool from pathname
  const getCurrentToolId = () => {
    const match = pathname.match(/^\/tools\/([^/]+)/);
    return match?.[1] || null;
  };

  const currentToolId = getCurrentToolId();

  // Get tools to display: pinned tools + current unpinned tool if applicable
  const getVisibleTools = () => {
    const pinnedToolsSet = new Set(pinnedTools);
    const visibleToolIds = new Set([...pinnedTools]);
    if (currentToolId && !pinnedToolsSet.has(currentToolId)) {
      visibleToolIds.add(currentToolId);
    }
    return tools.filter((tool) => visibleToolIds.has(tool.id));
  };

  // Group tools by category and sort
  const getGroupedTools = () => {
    const visibleTools = getVisibleTools();
    const grouped = visibleTools.reduce(
      (acc, tool) => {
        if (!acc[tool.category]) {
          acc[tool.category] = [];
        }
        acc[tool.category].push(tool);
        return acc;
      },
      {} as Record<string, typeof tools>
    );
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    });
    return grouped;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const groupedTools = getGroupedTools();
  const categories = Object.keys(groupedTools).sort();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Search className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">ConstellAI</span>
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Hub</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isLoaded &&
          categories.map((category) => {
            const isExpanded = expandedCategories[category] !== false;
            const categoryTools = groupedTools[category];

            return (
              <SidebarGroup key={category}>
                <SidebarGroupLabel
                  className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md transition-colors flex items-center justify-between"
                  onClick={() => toggleCategory(category)}
                >
                  <span>{category}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </SidebarGroupLabel>
                {isExpanded && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {categoryTools.map((tool) => {
                        const isCurrentTool = currentToolId === tool.id;
                        const isToolPinned = isPinned(tool.id);
                        const isTemporary = isCurrentTool && !isToolPinned;

                        return (
                          <SidebarMenuItem key={tool.id}>
                            <SidebarMenuButton
                              asChild
                              isActive={pathname === tool.href}
                              className={cn(
                                isTemporary &&
                                  "opacity-70 italic border-l-2 border-amber-400"
                              )}
                            >
                              <Link href={tool.href}>
                                <tool.icon className="h-4 w-4" />
                                <span>{tool.name}</span>
                                {isTemporary && (
                                  <span className="text-xs text-amber-600 ml-1">
                                    (visiting)
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuButton>
                            <SidebarMenuAction
                              onClick={() => toggle(tool.id)}
                              showOnHover={true}
                            >
                              {isToolPinned ? (
                                <PinOff className="h-4 w-4" />
                              ) : (
                                <Pin className="h-4 w-4" />
                              )}
                            </SidebarMenuAction>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            );
          })}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDialog}
                className={cn(
                  "w-full justify-start gap-2",
                  hasApiKey &&
                    "text-green-600 border-green-600/30 bg-green-50 dark:bg-green-950"
                )}
              >
                <Key className="h-4 w-4 shrink-0" />
                <span>{hasApiKey ? "API key configured" : "Set API key"}</span>
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
      </SidebarFooter>
    </Sidebar>
  );
}
