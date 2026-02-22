import { getCertifications } from "@/lib/data";
import PracticeClient from "./practice-client";

export function generateStaticParams() {
  return getCertifications().map((cert) => ({ certId: cert.id }));
}

export default function PracticePage() {
  return <PracticeClient />;
}
