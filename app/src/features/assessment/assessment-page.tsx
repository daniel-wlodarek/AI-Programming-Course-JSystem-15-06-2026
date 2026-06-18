"use client";

import { IntakeForm } from "./intake-form";
import { type IntakeFormSubmission } from "./types";

export function AssessmentPage() {
  function handleSubmit(submission: IntakeFormSubmission) {
    // T4 owns the typed callback boundary only. The API connection is added in T6.
    void submission;
  }

  return (
    <section className="grid w-full gap-6 py-8">
      <IntakeForm onSubmit={handleSubmit} />
    </section>
  );
}
