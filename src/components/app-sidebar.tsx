"use client";

import {
  MessageSquare,
  MoreVertical,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
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
import { useConversations } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const router = useRouter();
  const {
    conversations,
    activeConversation,
    createConversation,
    loadConversation,
    deleteConversation,
    pinConversation,
  } = useConversations();
  const [searchQuery, setSearchQuery] = useState("");

  const handleNewChat = () => {
    const newConv = createConversation();
    router.push(`/?id=${newConv.id}`);
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages.some((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const pinnedConversations = filteredConversations.filter((c) => c.pinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.pinned);

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">ConstellAI</span>
          </Link>
          <SidebarTrigger />
        </div>
        <div className="px-4 pb-2">
          <Button onClick={handleNewChat} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Search</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {pinnedConversations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Pinned</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pinnedConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversation?.id === conversation.id}
                    onSelect={() => {
                      loadConversation(conversation.id);
                      router.push(`/?id=${conversation.id}`);
                    }}
                    onPin={(pinned) => pinConversation(conversation.id, pinned)}
                    onDelete={() => deleteConversation(conversation.id)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {unpinnedConversations.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                unpinnedConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversation?.id === conversation.id}
                    onSelect={() => {
                      loadConversation(conversation.id);
                      router.push(`/?id=${conversation.id}`);
                    }}
                    onPin={(pinned) => pinConversation(conversation.id, pinned)}
                    onDelete={() => deleteConversation(conversation.id)}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

interface ConversationItemProps {
  conversation: any;
  isActive: boolean;
  onSelect: () => void;
  onPin: (pinned: boolean) => void;
  onDelete: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onPin,
  onDelete,
}: ConversationItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onSelect}
        isActive={isActive}
        className={cn("group relative")}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="truncate">{conversation.title}</span>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover={true}>
            <MoreVertical className="h-4 w-4" />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onClick={() => onPin(!conversation.pinned)}>
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
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
