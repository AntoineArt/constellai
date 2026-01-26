"use client";

import { Key, MessageSquare, Plus, Search, Settings, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ConversationItem } from "@/components/sidebar/conversation-item";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useApiKey } from "@/hooks/use-api-key";
import { useDebounce } from "@/hooks/use-debounce";
import { useConversations } from "@/lib/storage";

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
  const { setApiKey, getMaskedApiKey, hasApiKey } = useApiKey();

  // Search state with debounce
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  // API Key dialog state - lazy mounted
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Memoized filtered conversations
  const filteredConversations = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return conversations;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.messages.some((msg) => msg.content.toLowerCase().includes(query))
    );
  }, [conversations, debouncedSearchQuery]);

  // Memoized pinned/unpinned split
  const { pinnedConversations, unpinnedConversations } = useMemo(() => {
    const pinned = filteredConversations.filter((c) => c.pinned);
    const unpinned = filteredConversations.filter((c) => !c.pinned);
    return { pinnedConversations: pinned, unpinnedConversations: unpinned };
  }, [filteredConversations]);

  // Check if we're in search mode with no results
  const hasSearchQuery = debouncedSearchQuery.trim().length > 0;
  const noSearchResults = hasSearchQuery && filteredConversations.length === 0;

  // Handlers
  const handleNewChat = useCallback(() => {
    const newConv = createConversation();
    router.push(`/?id=${newConv.id}`);
  }, [createConversation, router]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      loadConversation(id);
      router.push(`/?id=${id}`);
    },
    [loadConversation, router]
  );

  const handlePinConversation = useCallback(
    (id: string, pinned: boolean) => {
      pinConversation(id, pinned);
    },
    [pinConversation]
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteConversation(deleteTarget);
      setDeleteTarget(null);
    }
    setShowDeleteConfirm(false);
  }, [deleteTarget, deleteConversation]);

  const handleSaveApiKey = useCallback(() => {
    setApiKey(apiKeyInput);
    setShowApiKeyDialog(false);
    setApiKeyInput("");
  }, [apiKeyInput, setApiKey]);

  const handleOpenApiKeyDialog = useCallback(() => {
    setApiKeyInput("");
    setShowApiKeyDialog(true);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Find conversation being deleted for the dialog
  const deleteTargetConversation = useMemo(
    () => conversations.find((c) => c.id === deleteTarget),
    [conversations, deleteTarget]
  );

  return (
    <>
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
          {/* Search */}
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-8 h-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Clear search</span>
                    </button>
                  )}
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* No search results */}
          {noSearchResults && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No conversations found for "{debouncedSearchQuery}"
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={handleClearSearch}
                className="mt-2"
              >
                Clear search
              </Button>
            </div>
          )}

          {/* Pinned Conversations */}
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
                      onSelect={() => handleSelectConversation(conversation.id)}
                      onPin={(pinned) =>
                        handlePinConversation(conversation.id, pinned)
                      }
                      onDelete={() => handleDeleteRequest(conversation.id)}
                      scrollIntoViewOnActive
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* All Conversations */}
          {!noSearchResults && (
            <SidebarGroup className="flex-1">
              <SidebarGroupLabel>
                {hasSearchQuery ? "Results" : "Conversations"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {unpinnedConversations.length === 0 &&
                  pinnedConversations.length === 0 &&
                  !hasSearchQuery ? (
                    <div className="px-4 py-8 text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        No conversations yet
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Start a new chat to begin
                      </p>
                    </div>
                  ) : (
                    unpinnedConversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isActive={activeConversation?.id === conversation.id}
                        onSelect={() =>
                          handleSelectConversation(conversation.id)
                        }
                        onPin={(pinned) =>
                          handlePinConversation(conversation.id, pinned)
                        }
                        onDelete={() => handleDeleteRequest(conversation.id)}
                        scrollIntoViewOnActive
                      />
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <div className="px-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleOpenApiKeyDialog}
              >
                {hasApiKey ? (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    <span className="truncate text-sm">
                      API Key: {getMaskedApiKey()}
                    </span>
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Configure API Key</span>
                  </>
                )}
              </Button>
            </div>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Conversation"
        description={`Are you sure you want to delete "${deleteTargetConversation?.title || "this conversation"}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />

      {/* API Key Dialog - Only mounted when needed */}
      {showApiKeyDialog && (
        <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
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
                    if (e.key === "Enter" && apiKeyInput) {
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
      )}
    </>
  );
}
