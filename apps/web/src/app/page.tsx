import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-background to-muted p-8 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight">HireFlow AI</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        AI-powered hiring platform. Post jobs, screen candidates with AI, run coding tests,
        schedule interviews, and manage your entire recruiting workflow in one place.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/register">
          <Button size="lg">Get started</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline">Sign in</Button>
        </Link>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          { title: "AI Screening", desc: "Match candidates to job requirements automatically." },
          { title: "Coding Tests", desc: "Evaluate technical skills with built-in assessments." },
          { title: "Interview Scheduler", desc: "Schedule interviews and chat with candidates." },
        ].map((feature) => (
          <div key={feature.title} className="rounded-lg border p-6 shadow-sm">
            <h3 className="font-bold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
