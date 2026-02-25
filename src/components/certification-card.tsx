import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Certification } from "@/types/certification";

interface CertificationCardProps {
  certification: Certification;
}

export function CertificationCard({ certification }: CertificationCardProps) {
  const isProfessional = certification.code.startsWith("SAP") || certification.code.startsWith("DOP") || certification.code.startsWith("AIP");

  return (
    <Link href={`/exam/${certification.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant={isProfessional ? "default" : "secondary"}>
              {isProfessional ? "Professional" : "Associate"}
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
