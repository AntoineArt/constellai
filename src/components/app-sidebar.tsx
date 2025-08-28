"use client";

import { Home, Search, Pin, PinOff } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
} from "@/components/ui/sidebar";
import { tools } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { usePinnedTools } from "@/lib/storage";

export function AppSidebar() {
  const pathname = usePathname();
  const { pinnedTools, toggle, isPinned, isLoaded } = usePinnedTools();

  // Filter tools to show only pinned ones
  const visibleTools = tools.filter((tool) => isPinned(tool.id));

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Search className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">ConstellAI</span>
        </Link>
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

        <SidebarGroup>
          <SidebarGroupLabel>AI Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoaded &&
                visibleTools.map((tool) => (
                  <SidebarMenuItem key={tool.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === tool.href}
                    >
                      <Link href={tool.href}>
                        <tool.icon className="h-4 w-4" />
                        <span>{tool.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuAction onClick={() => toggle(tool.id)}>
                      <PinOff className="h-4 w-4" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}

              {/* Show unpinned tools for pinning */}
              {isLoaded &&
                tools
                  .filter((tool) => !isPinned(tool.id))
                  .map((tool) => (
                    <SidebarMenuItem key={`unpinned-${tool.id}`}>
                      <SidebarMenuButton asChild className="opacity-50">
                        <Link href={tool.href}>
                          <tool.icon className="h-4 w-4" />
                          <span>{tool.name}</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuAction onClick={() => toggle(tool.id)}>
                        <Pin className="h-4 w-4" />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
