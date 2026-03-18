"use client";

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <div className="h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between gap-2 sm:gap-3 overflow-hidden">
        <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate min-w-0">
          {title}
        </h1>
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0 flex-wrap">
          {actions}
        </div>
      </div>
    </div>
  );
}
