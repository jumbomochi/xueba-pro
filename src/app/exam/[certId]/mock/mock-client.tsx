"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useExam } from "@/contexts/exam-context";
import { getCertification } from "@/lib/data";
import { getQuestions } from "@/lib/data";
import { selectQuestionsByDomain } from "@/lib/questions";
import { QuestionCard } from "@/components/question-card";
import { ExamTimer } from "@/components/exam-timer";
import { ExamProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";

export default function MockClient() {
  const router = useRouter();
  const params = useParams<{ certId: string }>();
  const certId = params.certId;
  const { state, startExam, answerQuestion, nextQuestion, goToQuestion, finishExam } = useExam();
  const [loading, setLoading] = useState(true);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    async function init() {
      const cert = getCertification(certId);
      if (!cert) {
        router.push("/");
        return;
      }
      const allQuestions = await getQuestions(certId);
      const selected = selectQuestionsByDomain(
        allQuestions,
        cert.domains,
        Math.min(cert.totalQuestions, allQuestions.length)
      );
      startExam(certId, "mock", selected, cert.timeMinutes * 60 * 1000);
      setLoading(false);
    }
    init();
  }, [certId, router, startExam]);

  useEffect(() => {
    if (state.isComplete && !loading) {
      router.push(`/exam/${certId}/mock/results`);
    }
  }, [state.isComplete, loading, certId, router]);

  if (loading || state.questions.length === 0) {
    return <p className="text-center text-muted-foreground">Loading exam...</p>;
  }

  const currentQuestion = state.questions[state.currentIndex];
  const isAnswered = state.answers.some(
    (a) => a.questionId === currentQuestion.id
  );

  const handleAnswer = (selectedAnswers: string[]) => {
    answerQuestion(selectedAnswers);
    setHasAnswered(true);
  };

  const handleNext = () => {
    setHasAnswered(false);
    if (state.currentIndex < state.questions.length - 1) {
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    setHasAnswered(false);
    if (state.currentIndex > 0) {
      goToQuestion(state.currentIndex - 1);
    }
  };

  const handleFinish = () => {
    finishExam();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <ExamProgressBar
          current={state.answers.length}
          total={state.questions.length}
        />
        {state.timeRemainingMs !== null && (
          <ExamTimer timeRemainingMs={state.timeRemainingMs} />
        )}
      </div>

      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        onAnswer={handleAnswer}
        showResult={false}
        questionNumber={state.currentIndex + 1}
        totalQuestions={state.questions.length}
      />

      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={state.currentIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {(hasAnswered || isAnswered) &&
            state.currentIndex < state.questions.length - 1 && (
              <Button onClick={handleNext}>Next</Button>
            )}
          {state.answers.length === state.questions.length && (
            <Button variant="default" onClick={handleFinish}>
              Finish Exam
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
