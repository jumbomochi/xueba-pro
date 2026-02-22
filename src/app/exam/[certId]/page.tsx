import Link from "next/link";
import { notFound } from "next/navigation";
import { getCertification, getCertifications } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return getCertifications().map((cert) => ({ certId: cert.id }));
}

export default async function ExamDashboard({ params }: { params: Promise<{ certId: string }> }) {
  const { certId } = await params;
  const cert = getCertification(certId);
  if (!cert) notFound();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <Badge variant="outline" className="mb-2">{cert.code}</Badge>
        <h1 className="text-2xl font-bold">{cert.name}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={`/exam/${cert.id}/practice`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Practice Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Answer questions one at a time with immediate explanations.
                Choose specific domains or practice all.
              </p>
            </CardContent>
          </Card>
        </Link>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exam Domains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cert.domains.map((domain) => (
              <div key={domain.name} className="flex justify-between items-center">
                <span className="text-sm">{domain.name}</span>
                <Badge variant="secondary">{domain.weight}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
