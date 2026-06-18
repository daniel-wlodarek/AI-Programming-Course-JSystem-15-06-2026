import { MANDATORY_DISCLAIMER } from "@/shared/polish-copy";
import {
  buildChatPrompt,
  buildDecisionPrompt,
  buildImageAnalysisPrompt,
} from "./prompts";

const assessmentInput = {
  requestType: "RETURN" as const,
  equipmentCategory: "Laptop" as const,
  equipmentName: "ThinkPad X1",
  purchaseDate: "2026-06-01",
  reason: "",
};

const imageAnalysis = {
  requestType: "RETURN" as const,
  summary: "Laptop jest czysty i bez widocznych uszkodzeń.",
  visibleDamage: "Brak.",
  likelyCause: "Nie dotyczy.",
  resaleCondition: "Wygląda na możliwy do odsprzedaży.",
  qualityIssues: [],
  confidence: "high" as const,
};

const decision = {
  decision: "APPROVE" as const,
  summary: "Zwrot prawdopodobnie kwalifikuje się do przyjęcia.",
  justification: "W terminie i bez widocznych śladów użycia.",
  policyReferences: ["Polityka zwrotów 2.1"],
  missingInformation: [],
  conditions: [],
  nextSteps: ["Spakuj kompletny zestaw."],
  disclaimer: MANDATORY_DISCLAIMER,
  confidence: "high" as const,
};

describe("AI prompt builders", () => {
  it("selects a return-specific image prompt", () => {
    const prompt = buildImageAnalysisPrompt({
      requestType: "RETURN",
      equipmentCategory: "Laptop",
      equipmentName: "ThinkPad X1",
    });

    expect(prompt).toContain("odsprzedaży jako nowy");
    expect(prompt).toContain("nie wydawaj decyzji końcowej");
    expect(prompt).not.toContain("zalania lub uszkodzenia mechaniczne jako przyczynę");
  });

  it("selects a complaint-specific image prompt", () => {
    const prompt = buildImageAnalysisPrompt({
      requestType: "COMPLAINT",
      equipmentCategory: "Smartfon",
      equipmentName: "Pixel",
    });

    expect(prompt).toContain("usterki");
    expect(prompt).toContain("wada fabryczna");
    expect(prompt).toContain("zalania");
  });

  it("builds a policy-grounded decision prompt with disclaimer and one policy", () => {
    const prompt = buildDecisionPrompt({
      assessmentInput,
      imageAnalysis,
      policy: {
        requestType: "RETURN",
        path: "docs/policies/polityka-zwrotow.md",
        text: "Reguła: 14 dni.",
      },
    });

    expect(prompt).toContain("docs/policies/polityka-zwrotow.md");
    expect(prompt).toContain("Reguła: 14 dni.");
    expect(prompt).toContain(MANDATORY_DISCLAIMER);
    expect(prompt).toContain("APPROVE, REJECT, NEEDS_MORE_INFO, CONDITIONAL, ESCALATE");
  });

  it("builds a case-scoped chat prompt with off-topic refusal rules", () => {
    const prompt = buildChatPrompt({
      activeSession: {
        sessionId: "session-1",
        assessmentInput,
        imageAnalysis,
        initialDecision: decision,
        firstAssistantMessage: "Dzień dobry. Zwrot prawdopodobnie kwalifikuje się.",
      },
      policy: {
        requestType: "RETURN",
        path: "docs/policies/polityka-zwrotow.md",
        text: "Reguła: 14 dni.",
      },
      latestUserMessage: "Napisz mi plan treningowy",
    });

    expect(prompt).toContain("odmów");
    expect(prompt).toContain("wróć do sprawy zwrotu lub reklamacji");
    expect(prompt).toContain("Reguła: 14 dni.");
    expect(prompt).toContain("bez zdjęcia");
  });
});
