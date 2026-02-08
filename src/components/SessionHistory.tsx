import { Clock, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShoppingSession } from "@/types/chat";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SessionHistoryProps {
  sessions: ShoppingSession[];
  activeSessionId?: string;
  onSelect: (session: ShoppingSession) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function SessionHistory({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  onNew,
}: SessionHistoryProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-sm font-semibold">History</h2>
        <Button size="sm" variant="ghost" onClick={onNew} className="h-9 gap-1 text-xs min-w-[44px]">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">
            No shopping sessions yet
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm cursor-pointer transition-colors hover:bg-muted min-h-[44px]",
                activeSessionId === session.id && "bg-muted"
              )}
              onClick={() => onSelect(session)}
            >
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 truncate">
                <p className="truncate text-xs font-medium">{session.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(session.updatedAt, { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="touch-visible shrink-0 rounded p-2.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
