import { z } from "zod";
import {
  DECISIONS,
  type DecisionResult,
  CONFIDENCE_LEVELS,
} from "@/shared/contracts";

export const decisionResultSchema = z
  .object({
    decision: z.enum(DECISIONS),
    summary: z.string().trim().min(1),
    justification: z.string().trim().min(1),
    policyReferences: z.array(z.string().trim().min(1)).min(1),
    missingInformation: z.array(z.string().trim().min(1)),
    conditions: z.array(z.string().trim().min(1)),
    nextSteps: z.array(z.string().trim().min(1)).min(1),
    disclaimer: z.string().trim().min(1),
    confidence: z.enum(CONFIDENCE_LEVELS),
  })
  .superRefine((value, context) => {
    const normalizedDisclaimer = value.disclaimer.toLowerCase();

    if (
      !normalizedDisclaimer.includes("wstępna") ||
      !normalizedDisclaimer.includes("niewiążąca") ||
      !normalizedDisclaimer.includes("zespół serwisu")
    ) {
      context.addIssue({
        code: "custom",
        path: ["disclaimer"],
        message: "Decision must include the mandatory non-binding disclaimer.",
      });
    }

    if (
      value.decision === "NEEDS_MORE_INFO" &&
      value.missingInformation.length === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["missingInformation"],
        message: "NEEDS_MORE_INFO requires missingInformation.",
      });
    }

    if (value.decision === "CONDITIONAL" && value.conditions.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["conditions"],
        message: "CONDITIONAL requires conditions.",
      });
    }
  });

export type DecisionValidationResult =
  | {
      ok: true;
      data: DecisionResult;
    }
  | {
      ok: false;
      errors: string[];
    };

export function validateDecisionResult(
  candidate: unknown,
): DecisionValidationResult {
  const parsed = decisionResultSchema.safeParse(candidate);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
}
