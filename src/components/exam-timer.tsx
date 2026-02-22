"use client";

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamTimerProps {
  timeRemainingMs: number;
}

export function ExamTimer({ timeRemainingMs }: ExamTimerProps) {
  const totalSeconds = Math.ceil(timeRemainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isLow = totalSeconds < 300;

  const formatted = hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-base font-mono px-3 py-1",
        isLow && "border-red-500 text-red-500 animate-pulse"
      )}
    >
      <Clock className="h-4 w-4 mr-1" />
      {formatted}
    </Badge>
  );
}
