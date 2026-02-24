import { Suspense } from "react";
import { getCertifications } from "@/lib/data";
import PracticeClient from "./practice-client";

export function generateStaticParams() {
  return getCertifications().map((cert) => ({ certId: cert.id }));
}

export default function PracticePage() {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground">Loading questions...</p>}>
      <PracticeClient />
    </Suspense>
  );
}
