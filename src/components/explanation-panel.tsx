import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

interface ExplanationPanelProps {
  isCorrect: boolean;
  explanation: string;
  correctAnswers: string[];
}

export function ExplanationPanel({
  isCorrect,
  explanation,
  correctAnswers,
}: ExplanationPanelProps) {
  return (
    <Card className={isCorrect ? "border-green-500" : "border-red-500"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isCorrect ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Correct!
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              Incorrect — correct answer: {correctAnswers.join(", ")}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{explanation}</p>
      </CardContent>
    </Card>
  );
}
