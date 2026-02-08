import type { WorkflowStage } from "@/config/agentStages";
import { STAGES } from "@/config/agentStages";
import { cn } from "@/lib/utils";

interface StageIndicatorProps {
  currentStage: WorkflowStage;
}

export function StageIndicator({ currentStage }: StageIndicatorProps) {
  const currentConfig = STAGES.find((s) => s.id === currentStage);
  if (!currentConfig) return null;

  return (
    <div className="flex items-center gap-1.5">
      {STAGES.map((s) => {
        const isCurrent = s.id === currentStage;
        const isPast = s.step < currentConfig.step;
        return (
          <div
            key={s.id}
            className={cn(
              "rounded-full transition-all",
              isCurrent
                ? "w-6 h-2 bg-primary"
                : isPast
                  ? "w-2 h-2 bg-primary/40"
                  : "w-2 h-2 bg-muted"
            )}
            title={`${s.step}. ${s.label}`}
          />
        );
      })}
      <span className="ml-1.5 text-[10px] font-medium text-muted-foreground hidden sm:inline">
        {currentConfig.label}
      </span>
    </div>
  );
}
