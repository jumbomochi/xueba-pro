"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useExam } from "@/contexts/exam-context";
import { getCertification } from "@/lib/data";
import { getQuestions } from "@/lib/data";
import { shuffleArray, filterByDomains, checkAnswer } from "@/lib/questions";
import { storage } from "@/lib/storage";
import { QuestionCard } from "@/components/question-card";
import { ExplanationPanel } from "@/components/explanation-panel";
import { ExamProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types/question";

export default function PracticeClient() {
  const router = useRouter();
  const params = useParams<{ certId: string }>();
  const searchParams = useSearchParams();
  const certId = params.certId;
  const { state, startExam, resumeExam, answerQuestion, nextQuestion } = useExam();
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [lastSelected, setLastSelected] = useState<string[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const selectedDomains = useRef<string[]>([]);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      const cert = getCertification(certId);
      if (!cert) {
        router.push("/");
        return;
      }

      const allQuestions = await getQuestions(certId);
      const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

      const resumeParam = searchParams.get("resume");
      const reviewParam = searchParams.get("review");
      const domainsParam = searchParams.get("domains");

      // Resume from checkpoint
      if (resumeParam === "1") {
        const checkpoint = storage.getCheckpoint(certId);
        if (checkpoint) {
          const questions = checkpoint.questionIds
            .map((id) => questionMap.get(id))
            .filter((q): q is Question => q !== undefined);

          if (questions.length > 0) {
            selectedDomains.current = checkpoint.selectedDomains;
            resumeExam(certId, questions, checkpoint.answers, checkpoint.currentIndex);
            setLoading(false);
            return;
          }
        }
        // Checkpoint missing or invalid — fall through to fresh start
      }

      // Wrong-answer review
      if (reviewParam === "wrong") {
        const wrongSet = storage.getWrongAnswers(certId);
        if (wrongSet && wrongSet.wrongQuestionIds.length > 0) {
          const questions = wrongSet.wrongQuestionIds
            .map((id) => questionMap.get(id))
            .filter((q): q is Question => q !== undefined);

          if (questions.length > 0) {
            setIsReviewMode(true);
            startExam(certId, "practice", shuffleArray(questions), null);
            setLoading(false);
            return;
          }
        }
        // No wrong answers — fall through to fresh start
      }

      // Domain-filtered or full practice
      let questions = allQuestions;
      if (domainsParam) {
        const domains = domainsParam.split(",").map((d) => decodeURIComponent(d.trim()));
        selectedDomains.current = domains;
        questions = filterByDomains(questions, domains);
      }

      startExam(certId, "practice", shuffleArray(questions), null);
      setLoading(false);
    }
    init();
  }, [certId, router, searchParams, startExam, resumeExam]);

  // Auto-save checkpoint after each answer (skip in review mode)
  const prevAnswerCount = useRef(0);
  useEffect(() => {
    if (
      isReviewMode ||
      state.questions.length === 0 ||
      state.answers.length === prevAnswerCount.current
    ) {
      return;
    }
    prevAnswerCount.current = state.answers.length;

    storage.saveCheckpoint({
      certificationId: certId,
      questionIds: state.questions.map((q) => q.id),
      answers: state.answers,
      currentIndex: state.currentIndex,
      selectedDomains: selectedDomains.current,
      startedAt: state.startedAt,
      savedAt: Date.now(),
    });
  }, [certId, isReviewMode, state.answers, state.questions, state.currentIndex, state.startedAt]);

  const handleComplete = useCallback(() => {
    // Save wrong answers
    const wrongAnswers = state.answers.filter((a) => !a.isCorrect);
    if (wrongAnswers.length > 0) {
      storage.saveWrongAnswers({
        certificationId: certId,
        wrongQuestionIds: wrongAnswers.map((a) => a.questionId),
        wrongAnswers,
        savedAt: Date.now(),
      });
    } else {
      // All correct — clear any previous wrong-answer set
      storage.clearWrongAnswers(certId);
    }

    // Clear checkpoint since session is done
    storage.clearCheckpoint(certId);

    // Add history entry
    const correct = state.answers.filter((a) => a.isCorrect).length;
    storage.addHistoryEntry({
      certificationId: certId,
      date: Date.now(),
      score: state.answers.length > 0 ? Math.round((correct / state.answers.length) * 100) : 0,
      mode: "practice",
      totalQuestions: state.answers.length,
    });

    router.push(`/exam/${certId}`);
  }, [certId, state.answers, router]);

  const handleQuit = () => {
    // Checkpoint is already auto-saved after each answer.
    // Also save wrong answers gathered so far.
    const wrongAnswers = state.answers.filter((a) => !a.isCorrect);
    if (wrongAnswers.length > 0 && !isReviewMode) {
      storage.saveWrongAnswers({
        certificationId: certId,
        wrongQuestionIds: wrongAnswers.map((a) => a.questionId),
        wrongAnswers,
        savedAt: Date.now(),
      });
    }
    router.push(`/exam/${certId}`);
  };

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
      handleComplete();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <ExamProgressBar
          current={state.currentIndex + 1}
          total={state.questions.length}
        />
        <Button variant="outline" size="sm" onClick={handleQuit}>
          Quit Practice
        </Button>
      </div>

      {isReviewMode && (
        <p className="text-sm text-muted-foreground text-center">
          Reviewing {state.questions.length} incorrect question{state.questions.length !== 1 ? "s" : ""}
        </p>
      )}

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
