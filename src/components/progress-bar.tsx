import { Progress } from "@/components/ui/progress";

interface ExamProgressBarProps {
  current: number;
  total: number;
}

export function ExamProgressBar({ current, total }: ExamProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <Progress value={percentage} className="flex-1" />
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {current} / {total}
      </span>
    </div>
  );
}
