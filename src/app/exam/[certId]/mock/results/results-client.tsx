"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useExam } from "@/contexts/exam-context";
import { getCertification } from "@/lib/data";
import { calculateScore, calculateDomainScores, isPassing } from "@/lib/scoring";
import { DomainChart } from "@/components/domain-chart";
import { QuestionCard } from "@/components/question-card";
import { ExplanationPanel } from "@/components/explanation-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";

export default function ResultsClient() {
  const router = useRouter();
  const params = useParams<{ certId: string }>();
  const certId = params.certId;
  const { state, reset } = useExam();

  const cert = getCertification(certId);
  const score = calculateScore(state.answers);
  const domainScores = calculateDomainScores(state.questions, state.answers);
  const correctCount = state.answers.filter((a) => a.isCorrect).length;
  const passing = cert ? isPassing(correctCount, state.questions.length, cert.passingScore) : false;

  useEffect(() => {
    if (state.isComplete && state.answers.length > 0) {
      storage.addHistoryEntry({
        certificationId: certId,
        date: Date.now(),
        score,
        mode: "mock",
        totalQuestions: state.questions.length,
      });
    }
  }, [state.isComplete, state.answers.length, certId, score, state.questions.length]);

  if (!state.isComplete || state.questions.length === 0) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">No exam results to display.</p>
        <Button onClick={() => router.push(`/exam/${certId}`)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const incorrectQuestions = state.questions.filter((q) => {
    const answer = state.answers.find((a) => a.questionId === q.id);
    return answer && !answer.isCorrect;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Exam Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold">{score}%</span>
            <Badge
              variant={passing ? "default" : "destructive"}
              className="text-lg px-3 py-1"
            >
              {passing ? "PASS" : "FAIL"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {correctCount} correct out of {state.questions.length} questions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <DomainChart domainScores={domainScores} />
        </CardContent>
      </Card>

      {incorrectQuestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">
            Review Incorrect Answers ({incorrectQuestions.length})
          </h2>
          {incorrectQuestions.map((q) => {
            const answer = state.answers.find((a) => a.questionId === q.id);
            return (
              <div key={q.id} className="space-y-3">
                <QuestionCard
                  question={q}
                  onAnswer={() => {}}
                  showResult={true}
                  selectedAnswers={answer?.selectedAnswers}
                />
                <ExplanationPanel
                  isCorrect={false}
                  explanation={q.explanation}
                  correctAnswers={q.correctAnswers}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => { reset(); router.push(`/exam/${certId}`); }}>
          Back to Dashboard
        </Button>
        <Button onClick={() => { reset(); router.push(`/exam/${certId}/mock`); }}>
          Retake Exam
        </Button>
      </div>
    </div>
  );
}
