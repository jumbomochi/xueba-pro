import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCertLevel } from "@/lib/cert-level";
import type { Certification } from "@/types/certification";

const LEVEL_LABELS = {
  associate: "Associate",
  professional: "Professional",
  specialty: "Specialty",
} as const;

interface CertificationCardProps {
  certification: Certification;
}

export function CertificationCard({ certification }: CertificationCardProps) {
  const level = getCertLevel(certification.code);

  return (
    <Link href={`/exam/${certification.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant={level === "associate" ? "secondary" : "default"}>
              {LEVEL_LABELS[level]}
            </Badge>
            <Badge variant="outline">{certification.code}</Badge>
          </div>
          <CardTitle className="text-lg mt-2">{certification.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{certification.totalQuestions} questions &middot; {certification.timeMinutes} min</p>
            <p>{certification.domains.length} domains</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
