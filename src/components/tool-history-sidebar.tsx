"use client";

import { useState } from "react";
import {
  Clock,
  Edit,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import type { ToolExecution } from "@/lib/storage";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ToolHistorySidebarProps {
  executions: ToolExecution[];
  activeExecutionId?: string | null;
  onSelectExecution: (executionId: string) => void;
  onDeleteExecution: (executionId: string) => void;
  onRenameExecution: (executionId: string, newTitle: string) => void;
  onNewExecution: () => void;
  toolName: string;
  getMessageCount?: (execution: ToolExecution) => number | undefined;
  getPreviewText?: (execution: ToolExecution) => string | undefined;
}

export function ToolHistorySidebar({
  executions,
  activeExecutionId,
  onSelectExecution,
  onDeleteExecution,
  onRenameExecution,
  onNewExecution,
  toolName,
  getMessageCount,
  getPreviewText,
}: ToolHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Filter executions based on search query
  const filteredExecutions = executions.filter((execution) =>
    execution.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group executions by date
  const groupedExecutions = filteredExecutions.reduce(
    (groups, execution) => {
      const date = new Date(execution.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(execution);
      return groups;
    },
    {} as Record<string, ToolExecution[]>
  );

  const handleStartEdit = (execution: ToolExecution) => {
    setEditingId(execution.id);
    setEditTitle(execution.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameExecution(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-[280px] max-w-[280px] min-w-[280px] border-r bg-background flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b flex-shrink-0 space-y-2 min-w-0 max-w-full">
        <div className="flex items-center justify-between min-w-0">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">History</h2>
          <Button size="sm" variant="default" onClick={onNewExecution} className="h-7 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Execution List */}
      <ScrollArea className="flex-1 min-w-0 max-w-full">
        <div className="p-2 min-w-0 max-w-full">
          {Object.keys(groupedExecutions).length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12 px-4">
              <Clock className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No history</p>
              <p className="text-xs mt-1">Your conversations will appear here</p>
            </div>
          ) : (
            <div className="space-y-4 min-w-0 max-w-full">
              {Object.entries(groupedExecutions).map(([date, dateExecutions]) => (
                <div key={date} className="min-w-0 max-w-full">
                  <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-1.5">
                    {date}
                  </h3>
                  <div className="space-y-0.5 min-w-0 max-w-full">
                    {dateExecutions.map((execution) => (
                      <div
                        key={execution.id}
                        className={`group relative rounded-md px-2 py-2 cursor-pointer transition-all overflow-hidden min-w-0 max-w-full ${
                          activeExecutionId === execution.id
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        }`}
                        onClick={() => onSelectExecution(execution.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelectExecution(execution.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        {editingId === execution.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              className="h-7 text-xs"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSaveEdit}
                                className="h-6 text-xs"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-6 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 w-full min-w-0 max-w-full">
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <h4 className="font-medium text-sm truncate" title={execution.title}>
                                {execution.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                <span className="whitespace-nowrap">
                                  {formatTime(execution.timestamp)}
                                </span>
                                {getMessageCount?.(execution) !== undefined && (
                                  <span className="flex items-center gap-0.5">
                                    <MessageSquare className="h-3 w-3" />
                                    {getMessageCount(execution)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(execution);
                                  }}
                                >
                                  <Edit className="mr-2 h-3.5 w-3.5" />
                                  <span className="text-sm">Rename</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteExecution(execution.id);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  <span className="text-sm">Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
