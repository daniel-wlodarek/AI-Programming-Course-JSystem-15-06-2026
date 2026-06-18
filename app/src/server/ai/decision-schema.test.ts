import { MANDATORY_DISCLAIMER } from "@/shared/polish-copy";
import { validateDecisionResult } from "./decision-schema";

const validDecision = {
  decision: "APPROVE",
  summary: "Zwrot prawdopodobnie kwalifikuje się do przyjęcia.",
  justification: "Zakup mieści się w terminie 14 dni.",
  policyReferences: ["Polityka zwrotów 2.1"],
  missingInformation: [],
  conditions: [],
  nextSteps: ["Przygotuj komplet akcesoriów."],
  disclaimer: MANDATORY_DISCLAIMER,
  confidence: "high",
};

describe("decision schema validation", () => {
  it("accepts a complete structured decision", () => {
    expect(validateDecisionResult(validDecision).ok).toBe(true);
  });

  it("rejects invalid decision enum values", () => {
    const result = validateDecisionResult({
      ...validDecision,
      decision: "MAYBE",
    });

    expect(result.ok).toBe(false);
  });

  it("requires the mandatory non-binding disclaimer", () => {
    const result = validateDecisionResult({
      ...validDecision,
      disclaimer: "To tylko sugestia.",
    });

    expect(result.ok).toBe(false);
  });

  it("requires missing information for NEEDS_MORE_INFO", () => {
    const result = validateDecisionResult({
      ...validDecision,
      decision: "NEEDS_MORE_INFO",
      missingInformation: [],
    });

    expect(result.ok).toBe(false);
  });

  it("requires conditions for CONDITIONAL", () => {
    const result = validateDecisionResult({
      ...validDecision,
      decision: "CONDITIONAL",
      conditions: [],
    });

    expect(result.ok).toBe(false);
  });
});
