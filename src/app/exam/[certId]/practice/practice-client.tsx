"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useExam } from "@/contexts/exam-context";
import { getCertification } from "@/lib/data";
import { getQuestions } from "@/lib/data";
import { shuffleArray } from "@/lib/questions";
import { QuestionCard } from "@/components/question-card";
import { ExplanationPanel } from "@/components/explanation-panel";
import { ExamProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { checkAnswer } from "@/lib/questions";

export default function PracticeClient() {
  const router = useRouter();
  const params = useParams<{ certId: string }>();
  const certId = params.certId;
  const { state, startExam, answerQuestion, nextQuestion } = useExam();
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [lastSelected, setLastSelected] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      const cert = getCertification(certId);
      if (!cert) {
        router.push("/");
        return;
      }
      const questions = await getQuestions(certId);
      const shuffled = shuffleArray(questions);
      startExam(certId, "practice", shuffled, null);
      setLoading(false);
    }
    init();
  }, [certId, router, startExam]);

  if (loading || state.questions.length === 0) {
    return <p className="text-center text-muted-foreground">Loading questions...</p>;
  }

  const currentQuestion = state.questions[state.currentIndex];

  const handleAnswer = (selectedAnswers: string[]) => {
    const isCorrect = checkAnswer(currentQuestion.correctAnswers, selectedAnswers);
    setLastAnswerCorrect(isCorrect);
    setLastSelected(selectedAnswers);
    answerQuestion(selectedAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    setLastSelected([]);
    if (state.currentIndex < state.questions.length - 1) {
      nextQuestion();
    } else {
      router.push(`/exam/${certId}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ExamProgressBar
        current={state.currentIndex + 1}
        total={state.questions.length}
      />

      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        onAnswer={handleAnswer}
        showResult={showExplanation}
        selectedAnswers={showExplanation ? lastSelected : undefined}
        questionNumber={state.currentIndex + 1}
        totalQuestions={state.questions.length}
      />

      {showExplanation && (
        <>
          <ExplanationPanel
            isCorrect={lastAnswerCorrect}
            explanation={currentQuestion.explanation}
            correctAnswers={currentQuestion.correctAnswers}
          />
          <Button onClick={handleNext} className="w-full">
            {state.currentIndex < state.questions.length - 1
              ? "Next Question"
              : "Finish Practice"}
          </Button>
        </>
      )}
    </div>
  );
}
