"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

interface TopBarProps {
  title: string;
  leftActions?: React.ReactNode;
  actions?: React.ReactNode;
}

export function TopBar({ title, leftActions, actions }: TopBarProps) {
  return (
    <div className="h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center gap-2 sm:gap-3 overflow-hidden px-2 sm:px-4">
        <div className="flex items-center gap-1 shrink-0">
          <SidebarTrigger />
          {leftActions}
        </div>

        <h1 className="flex-1 text-base sm:text-lg md:text-xl font-semibold truncate min-w-0">
          {title}
        </h1>

        {actions && (
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
