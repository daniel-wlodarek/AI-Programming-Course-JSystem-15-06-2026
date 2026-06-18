import Image from "next/image";
import { AssessmentPage } from "@/features/assessment/assessment-page";

export default function Page() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-default)] text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-5">
          <Image
            src="/logo.svg"
            alt=""
            width={32}
            height={32}
            priority
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-bold uppercase text-[var(--color-brand-primary)]">
              TechSerwis
            </p>
            <h1 className="text-2xl font-bold tracking-normal sm:text-3xl">
              Asystent decyzji serwisowej
            </h1>
          </div>
        </header>

        <AssessmentPage />
      </div>
    </main>
  );
}
