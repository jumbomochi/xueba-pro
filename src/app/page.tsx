import { getCertifications } from "@/lib/data";
import { CertificationCard } from "@/components/certification-card";

export default function HomePage() {
  const certifications = getCertifications();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Practice Exams</h1>
        <p className="text-muted-foreground mt-2">
          Choose a certification to start practicing
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {certifications.map((cert) => (
          <CertificationCard key={cert.id} certification={cert} />
        ))}
      </div>
    </div>
  );
}
