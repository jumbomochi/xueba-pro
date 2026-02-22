import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ExamProvider } from "@/contexts/exam-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "xueba-pro — AWS Certification Practice Exams",
  description: "AI-powered practice exam generator for AWS professional certifications",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ExamProvider>
          <div className="min-h-screen bg-background">
            <header className="border-b">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <a href="/" className="text-xl font-bold">xueba-pro</a>
                <a href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
                  Settings
                </a>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </ExamProvider>
      </body>
    </html>
  );
}
