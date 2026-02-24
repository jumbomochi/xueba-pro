import { notFound } from "next/navigation";
import { getCertification, getCertifications } from "@/lib/data";
import DashboardClient from "./dashboard-client";

export function generateStaticParams() {
  return getCertifications().map((cert) => ({ certId: cert.id }));
}

export default async function ExamDashboard({ params }: { params: Promise<{ certId: string }> }) {
  const { certId } = await params;
  const cert = getCertification(certId);
  if (!cert) notFound();

  return <DashboardClient certification={cert} />;
}
