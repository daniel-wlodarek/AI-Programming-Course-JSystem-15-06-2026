"use client";

import { useState } from "react";
import { type AssessmentSuccessResponse } from "@/shared/contracts";
import { assessmentFlowCopy, serviceCopy } from "@/shared/polish-copy";
import { DecisionCard } from "./decision-card";
import { IntakeForm } from "./intake-form";
import { type IntakeFormSubmission } from "./types";

type ScreenState = "form" | "processing" | "chat" | "error";

function buildAssessmentFormData(submission: IntakeFormSubmission) {
  const formData = new FormData();
  formData.set("requestType", submission.input.requestType);
  formData.set("equipmentCategory", submission.input.equipmentCategory);
  formData.set("equipmentName", submission.input.equipmentName);
  formData.set("purchaseDate", submission.input.purchaseDate);
  formData.set("reason", submission.input.reason);
  formData.set("image", submission.image);
  return formData;
}

export function AssessmentPage() {
  const [screenState, setScreenState] = useState<ScreenState>("form");
  const [activeSession, setActiveSession] =
    useState<AssessmentSuccessResponse | null>(null);
  const [lastSubmission, setLastSubmission] =
    useState<IntakeFormSubmission | null>(null);
  const [errorMessage, setErrorMessage] = useState(serviceCopy.assessmentUnavailable);

  async function submitAssessment(submission: IntakeFormSubmission) {
    setLastSubmission(submission);
    setActiveSession(null);
    setScreenState("processing");

    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        body: buildAssessmentFormData(submission),
      });
      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(body.message ?? serviceCopy.assessmentUnavailable);
        setScreenState("error");
        return;
      }

      setActiveSession(body as AssessmentSuccessResponse);
      setScreenState("chat");
    } catch {
      setErrorMessage(serviceCopy.assessmentUnavailable);
      setScreenState("error");
    }
  }

  function handleRetry() {
    if (lastSubmission) {
      void submitAssessment(lastSubmission);
    }
  }

  function handleBackToForm() {
    setActiveSession(null);
    setScreenState("form");
  }

  return (
    <section className="grid w-full gap-6 py-8">
      {screenState === "form" || screenState === "processing" ? (
        <IntakeForm
          disabled={screenState === "processing"}
          onSubmit={submitAssessment}
        />
      ) : null}

      {screenState === "processing" ? (
        <div
          className="rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5 text-sm font-bold text-[var(--color-text-primary)]"
          role="status"
        >
          {assessmentFlowCopy.processing}
        </div>
      ) : null}

      {screenState === "error" ? (
        <div className="grid gap-4 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-tinted)] p-5">
          <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
            {errorMessage}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-[9999px] bg-[var(--color-brand-primary)] px-5 py-2 text-sm font-bold text-[var(--color-text-on-brand)]"
              type="button"
              onClick={handleRetry}
            >
              {assessmentFlowCopy.retry}
            </button>
            <button
              className="rounded-[9999px] border border-[var(--color-border-strong,#535353)] px-5 py-2 text-sm font-bold text-[var(--color-text-primary)]"
              type="button"
              onClick={handleBackToForm}
            >
              {assessmentFlowCopy.backToForm}
            </button>
          </div>
        </div>
      ) : null}

      {screenState === "chat" && activeSession ? (
        <section aria-label="Czat z asystentem" className="grid gap-4">
          <DecisionCard decision={activeSession.initialDecision} />
        </section>
      ) : null}
    </section>
  );
}
