import { type DecisionResult } from "./contracts";

export const DECISION_LABELS: Record<DecisionResult["decision"], string> = {
  APPROVE: "Prawdopodobnie kwalifikuje się",
  REJECT: "Prawdopodobnie nie kwalifikuje się",
  NEEDS_MORE_INFO: "Potrzebne dodatkowe informacje",
  CONDITIONAL: "Warunkowo możliwe",
  ESCALATE: "Wymaga konsultacji z zespołem",
};

export function formatFirstAssistantMessage(decision: DecisionResult): string {
  const optionalSections = [
    decision.missingInformation.length > 0
      ? `Brakujące informacje:\n${decision.missingInformation
          .map((item) => `- ${item}`)
          .join("\n")}`
      : null,
    decision.conditions.length > 0
      ? `Warunki:\n${decision.conditions.map((item) => `- ${item}`).join("\n")}`
      : null,
  ].filter(Boolean);

  return [
    "Dzień dobry.",
    `Decyzja: ${DECISION_LABELS[decision.decision]}`,
    `Uzasadnienie: ${decision.justification}`,
    ...optionalSections,
    `Kolejne kroki:\n${decision.nextSteps.map((step) => `- ${step}`).join("\n")}`,
    decision.disclaimer,
  ].join("\n\n");
}
