"use client";

import {
  Home,
  Search,
  Pin,
  PinOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { tools } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { usePinnedTools } from "@/lib/storage";

export function AppSidebar() {
  const pathname = usePathname();
  const { pinnedTools, toggle, isPinned, isLoaded } = usePinnedTools();
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  // Get current tool from pathname
  const getCurrentToolId = () => {
    const match = pathname.match(/^\/tools\/([^\/]+)/);
    return match?.[1] || null;
  };

  const currentToolId = getCurrentToolId();

  // Get tools to display: pinned tools + current unpinned tool if applicable
  const getVisibleTools = () => {
    const pinnedToolsSet = new Set(pinnedTools);
    const visibleToolIds = new Set([...pinnedTools]);

    // Add current tool if not pinned
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

    // Sort tools within each category by name
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
            const isExpanded = expandedCategories[category] !== false; // Default to expanded
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
    </Sidebar>
  );
}
