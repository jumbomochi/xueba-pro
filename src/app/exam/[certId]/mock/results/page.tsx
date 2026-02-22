import { getCertifications } from "@/lib/data";
import ResultsClient from "./results-client";

export function generateStaticParams() {
  return getCertifications().map((cert) => ({ certId: cert.id }));
}

export default function MockResultsPage() {
  return <ResultsClient />;
}
