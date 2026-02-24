"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Certification } from "@/types/certification";
import type { Question } from "@/types/question";
import { getQuestions } from "@/lib/data";
import { countByDomain } from "@/lib/questions";
import { storage } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { PracticeCheckpoint, WrongAnswerSet } from "@/types/exam-session";

interface DashboardClientProps {
  certification: Certification;
}

export default function DashboardClient({ certification: cert }: DashboardClientProps) {
  const router = useRouter();
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [domainCounts, setDomainCounts] = useState<Record<string, number>>({});
  const [checkpoint, setCheckpoint] = useState<PracticeCheckpoint | null>(null);
  const [wrongSet, setWrongSet] = useState<WrongAnswerSet | null>(null);

  useEffect(() => {
    async function load() {
      const questions: Question[] = await getQuestions(cert.id);
      setDomainCounts(countByDomain(questions));
    }
    load();
    setCheckpoint(storage.getCheckpoint(cert.id));
    setWrongSet(storage.getWrongAnswers(cert.id));
  }, [cert.id]);

  const toggleDomain = (domainName: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domainName) ? prev.filter((d) => d !== domainName) : [...prev, domainName]
    );
  };

  const practiceUrl =
    selectedDomains.length > 0
      ? `/exam/${cert.id}/practice?domains=${selectedDomains.map(encodeURIComponent).join(",")}`
      : `/exam/${cert.id}/practice`;

  const selectedQuestionCount =
    selectedDomains.length > 0
      ? selectedDomains.reduce((sum, d) => sum + (domainCounts[d] || 0), 0)
      : Object.values(domainCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <Badge variant="outline" className="mb-2">{cert.code}</Badge>
        <h1 className="text-2xl font-bold">{cert.name}</h1>
      </div>

      {/* Resume banner */}
      {checkpoint && (
        <Card className="border-primary/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Resume Practice Session</p>
                <p className="text-sm text-muted-foreground">
                  {checkpoint.answers.length} of {checkpoint.questionIds.length} questions answered
                  {checkpoint.selectedDomains.length > 0 && (
                    <> &middot; {checkpoint.selectedDomains.length} domain{checkpoint.selectedDomains.length !== 1 ? "s" : ""}</>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    storage.clearCheckpoint(cert.id);
                    setCheckpoint(null);
                  }}
                >
                  Discard
                </Button>
                <Button size="sm" onClick={() => router.push(`/exam/${cert.id}/practice?resume=1`)}>
                  Resume
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wrong-answer review */}
      {wrongSet && wrongSet.wrongQuestionIds.length > 0 && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Review Incorrect Answers</p>
                <p className="text-sm text-muted-foreground">
                  {wrongSet.wrongQuestionIds.length} question{wrongSet.wrongQuestionIds.length !== 1 ? "s" : ""} to review
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    storage.clearWrongAnswers(cert.id);
                    setWrongSet(null);
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => router.push(`/exam/${cert.id}/practice?review=wrong`)}
                >
                  Review Wrong Answers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode selection */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer h-full"
          onClick={() => router.push(practiceUrl)}
        >
          <CardHeader>
            <CardTitle>Practice Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Answer questions one at a time with immediate explanations.
              {selectedDomains.length > 0
                ? ` ${selectedQuestionCount} questions from ${selectedDomains.length} selected domain${selectedDomains.length !== 1 ? "s" : ""}.`
                : ` All ${selectedQuestionCount} questions.`}
            </p>
          </CardContent>
        </Card>

        <Link href={`/exam/${cert.id}/mock`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Mock Exam</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {cert.totalQuestions} questions &middot; {cert.timeMinutes} minutes.
                Simulates the real exam with timer and scoring.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Domain selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exam Domains</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select domains to focus your practice, or leave all unchecked to practice everything.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cert.domains.map((domain) => (
              <label
                key={domain.name}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Checkbox
                  checked={selectedDomains.includes(domain.name)}
                  onCheckedChange={() => toggleDomain(domain.name)}
                />
                <span className="text-sm flex-1">{domain.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {domainCounts[domain.name] || 0} Qs
                </Badge>
                <Badge variant="outline">{domain.weight}%</Badge>
              </label>
            ))}
          </div>
          {selectedDomains.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDomains([])}
              >
                Clear Selection
              </Button>
              <Button size="sm" onClick={() => router.push(practiceUrl)}>
                Practice Selected ({selectedQuestionCount} questions)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
