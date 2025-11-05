"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Search,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Plus,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ToolExecution } from "@/lib/storage";

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
    <div className="w-full max-w-[288px] lg:max-w-[320px] border-r bg-muted/20 flex flex-col h-full overflow-x-hidden overflow-y-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">{toolName} History</h2>
          <Button size="sm" onClick={onNewExecution} className="gap-1">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Execution List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {Object.keys(groupedExecutions).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No history yet</p>
              <p className="text-xs">
                Start using {toolName.toLowerCase()} to see your history here
              </p>
            </div>
          ) : (
            Object.entries(groupedExecutions).map(([date, dateExecutions]) => (
              <div key={date} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background/80 backdrop-blur-sm py-1">
                  {date}
                </h3>
                <div className="space-y-1">
                  {dateExecutions.map((execution) => (
                    <div
                      key={execution.id}
                      className={`group relative rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                        activeExecutionId === execution.id
                          ? "bg-accent border-accent-foreground/20"
                          : "bg-background"
                      }`}
                      onClick={() => onSelectExecution(execution.id)}
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
                            className="h-8 text-sm"
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
                        <>
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate" title={execution.title}>
                                {execution.title}
                              </h4>
                              {getPreviewText && getPreviewText(execution) && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                                  {getPreviewText(execution)}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  <span className="whitespace-nowrap">
                                    {formatTime(execution.timestamp)}
                                  </span>
                                </div>
                                {getMessageCount && getMessageCount(execution) !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3 shrink-0" />
                                    <span>{getMessageCount(execution)}</span>
                                  </div>
                                )}
                                {execution.model && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                                    {execution.model.replace(/.*\//, "")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(execution);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteExecution(execution.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
