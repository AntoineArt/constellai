"use client";

import {
  Key,
  MessageSquare,
  MoreVertical,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useConversations } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { ConversationItem } from "@/types/chat";

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
  const { apiKey, setApiKey, getMaskedApiKey, hasApiKey } = useApiKey();
  const [searchQuery, setSearchQuery] = useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const handleNewChat = () => {
    const newConv = createConversation();
    router.push(`/?id=${newConv.id}`);
  };

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput);
    setShowApiKeyDialog(false);
    setApiKeyInput("");
  };

  const handleOpenApiKeyDialog = () => {
    setApiKeyInput("");
    setShowApiKeyDialog(true);
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <SidebarMenuButton onClick={handleOpenApiKeyDialog}>
                  {hasApiKey ? (
                    <>
                      <Key className="h-4 w-4" />
                      <span className="truncate">API Key: {getMaskedApiKey()}</span>
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4" />
                      <span>Configure API Key</span>
                    </>
                  )}
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>API Key Configuration</DialogTitle>
                  <DialogDescription>
                    Enter your AI Gateway API key to use ConstellAI. Your key is
                    stored locally in your browser.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your API key"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveApiKey();
                        }
                      }}
                    />
                  </div>
                  {hasApiKey && (
                    <div className="text-sm text-muted-foreground">
                      Current key: {getMaskedApiKey()}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowApiKeyDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveApiKey} disabled={!apiKeyInput}>
                    Save API Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

interface ConversationItemProps {
  conversation: ConversationItem;
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
