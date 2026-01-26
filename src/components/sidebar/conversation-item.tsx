"use client";

import { memo, useCallback, useRef, useEffect } from "react";
import {
  MessageSquare,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/storage/types";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onPin: (pinned: boolean) => void;
  onDelete: () => void;
  onRename?: () => void;
  scrollIntoViewOnActive?: boolean;
}

function ConversationItemComponent({
  conversation,
  isActive,
  onSelect,
  onPin,
  onDelete,
  onRename,
  scrollIntoViewOnActive = false,
}: ConversationItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);

  // Scroll into view when active
  useEffect(() => {
    if (isActive && scrollIntoViewOnActive && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isActive, scrollIntoViewOnActive]);

  const handlePinToggle = useCallback(() => {
    onPin(!conversation.pinned);
  }, [conversation.pinned, onPin]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete();
    },
    [onDelete]
  );

  // Format relative time
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <SidebarMenuItem ref={itemRef}>
      <SidebarMenuButton
        onClick={onSelect}
        isActive={isActive}
        className={cn("group relative pr-8")}
        tooltip={conversation.title}
      >
        <MessageSquare className="h-4 w-4 shrink-0" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate text-sm">{conversation.title}</span>
          <span className="text-xs text-muted-foreground truncate">
            {getRelativeTime(conversation.updatedAt)}
          </span>
        </div>
        {conversation.pinned && (
          <Pin className="h-3 w-3 text-muted-foreground absolute right-8 top-1/2 -translate-y-1/2" />
        )}
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48">
          <DropdownMenuItem onClick={handlePinToggle}>
            {conversation.pinned ? (
              <>
                <PinOff className="h-4 w-4 mr-2" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 mr-2" />
                Pin
              </>
            )}
          </DropdownMenuItem>
          {onRename && (
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

// Memoized component - only re-renders when props actually change
export const ConversationItem = memo(
  ConversationItemComponent,
  (prev, next) => {
    return (
      prev.conversation.id === next.conversation.id &&
      prev.conversation.title === next.conversation.title &&
      prev.conversation.pinned === next.conversation.pinned &&
      prev.conversation.updatedAt === next.conversation.updatedAt &&
      prev.isActive === next.isActive
    );
  }
);

ConversationItem.displayName = "ConversationItem";
