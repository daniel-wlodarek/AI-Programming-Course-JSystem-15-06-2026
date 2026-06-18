import { validateChatRequest } from "./chat";

const activeSession = {
  sessionId: "session-1",
  assessmentInput: {
    requestType: "RETURN",
    equipmentCategory: "Laptop",
    equipmentName: "ThinkPad X1",
    purchaseDate: "2026-06-01",
    reason: "",
  },
  imageAnalysis: {
    requestType: "RETURN",
    summary: "Na zdjęciu widoczny jest laptop bez uszkodzeń.",
    visibleDamage: "Brak widocznych uszkodzeń.",
    likelyCause: "Nie dotyczy.",
    resaleCondition: "Dobry stan do odsprzedaży.",
    qualityIssues: [],
    confidence: "high",
  },
  initialDecision: {
    decision: "APPROVE",
    summary: "Zwrot prawdopodobnie kwalifikuje się do przyjęcia.",
    justification: "Zgłoszenie mieści się w terminie 14 dni.",
    policyReferences: ["Polityka zwrotów 2.1"],
    missingInformation: [],
    conditions: [],
    nextSteps: ["Przygotuj komplet akcesoriów."],
    disclaimer:
      "To wstępna, niewiążąca ocena. Ostateczną decyzję podejmuje zespół serwisu.",
    confidence: "high",
  },
  firstAssistantMessage:
    "Dzień dobry. Zwrot prawdopodobnie kwalifikuje się do przyjęcia.",
};

describe("chat request validation", () => {
  it("accepts active session context and the latest user message", () => {
    const result = validateChatRequest({
      activeSession,
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [{ type: "text", text: "Czy muszę odesłać pudełko?" }],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.latestUserMessage).toBe(
        "Czy muszę odesłać pudełko?",
      );
    }
  });

  it("rejects missing image analysis context", () => {
    const result = validateChatRequest({
      activeSession: { ...activeSession, imageAnalysis: undefined },
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [{ type: "text", text: "Co dalej?" }],
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(
        "Brakuje kontekstu analizy zdjęcia. Rozpocznij zgłoszenie ponownie.",
      );
    }
  });

  it("rejects image data URLs anywhere in chat payload", () => {
    const result = validateChatRequest({
      activeSession,
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [
            {
              type: "text",
              text: "data:image/png;base64,abc",
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(
        "Czat przyjmuje tylko tekst. Nie przesyłaj zdjęć po rozpoczęciu rozmowy.",
      );
    }
  });
});
