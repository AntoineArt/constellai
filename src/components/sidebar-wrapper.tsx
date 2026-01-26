"use client";

import { useEffect, useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { usePreferences } from "@/lib/storage";

interface SidebarWrapperProps {
  children: React.ReactNode;
}

function SidebarStateSync() {
  const { open } = useSidebar();
  const { preferences, updatePreferences, isLoaded } = usePreferences();

  // Sync sidebar state to preferences when it changes
  useEffect(() => {
    if (isLoaded && preferences.sidebarCollapsed !== !open) {
      updatePreferences({ sidebarCollapsed: !open });
    }
  }, [open, isLoaded, preferences.sidebarCollapsed, updatePreferences]);

  return null;
}

export function SidebarWrapper({ children }: SidebarWrapperProps) {
  const { preferences, isLoaded } = usePreferences();
  const [defaultOpen, setDefaultOpen] = useState(true);

  // Set initial state from preferences once loaded
  useEffect(() => {
    if (isLoaded) {
      setDefaultOpen(!preferences.sidebarCollapsed);
    }
  }, [isLoaded, preferences.sidebarCollapsed]);

  // Wait for preferences to load to avoid hydration mismatch
  if (!isLoaded) {
    return (
      <div className="flex h-full w-full">
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SidebarStateSync />
      <AppSidebar />
      <SidebarInset className="overflow-hidden">{children}</SidebarInset>
    </SidebarProvider>
  );
}
