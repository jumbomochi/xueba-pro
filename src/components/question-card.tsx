"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/question";

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedAnswers: string[]) => void;
  showResult: boolean;
  selectedAnswers?: string[];
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuestionCard({
  question,
  onAnswer,
  showResult,
  selectedAnswers: externalSelected,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string[]>(externalSelected || []);
  const isMultiple = question.type === "multiple";

  const toggleOption = (key: string) => {
    if (showResult) return;
    if (isMultiple) {
      setSelected((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
    } else {
      setSelected([key]);
    }
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    onAnswer(selected);
  };

  const displaySelected = showResult ? (externalSelected || []) : selected;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          {questionNumber && totalQuestions && (
            <Badge variant="outline">
              {questionNumber} / {totalQuestions}
            </Badge>
          )}
          <Badge variant="secondary">{question.domain}</Badge>
          {isMultiple && <Badge>Select multiple</Badge>}
        </div>
        <p className="text-lg font-medium leading-relaxed">{question.stem}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.options.map((option) => {
          const isSelected = displaySelected.includes(option.key);
          const isCorrect = showResult && question.correctAnswers.includes(option.key);
          const isWrong = showResult && isSelected && !isCorrect;

          return (
            <button
              key={option.key}
              onClick={() => toggleOption(option.key)}
              disabled={showResult}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-colors",
                "hover:border-primary/50",
                isSelected && !showResult && "border-primary bg-primary/5",
                isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                isWrong && "border-red-500 bg-red-50 dark:bg-red-950",
                !isSelected && !isCorrect && !isWrong && "border-border",
                showResult && "cursor-default"
              )}
            >
              <span className="font-semibold mr-2">{option.key}.</span>
              {option.text}
            </button>
          );
        })}

        {!showResult && (
          <Button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="w-full mt-4"
          >
            Submit Answer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
