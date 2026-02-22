import { getCertifications } from "@/lib/data";
import MockClient from "./mock-client";

export function generateStaticParams() {
  return getCertifications().map((cert) => ({ certId: cert.id }));
}

export default function MockExamPage() {
  return <MockClient />;
}
