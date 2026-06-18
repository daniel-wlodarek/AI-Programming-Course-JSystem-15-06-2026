// @vitest-environment node

import { MANDATORY_DISCLAIMER } from "@/shared/polish-copy";
import {
  resetAIAdapterFactoryForTests,
  setAIAdapterFactoryForTests,
} from "@/server/ai/adapter-factory";
import { createMockAIAdapter } from "@/server/ai/mock-adapter";
import { POST } from "./route";

const originalEnv = { ...process.env };

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
    summary: "Laptop jest czysty i bez widocznych uszkodzeń.",
    visibleDamage: "Brak.",
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
    disclaimer: MANDATORY_DISCLAIMER,
    confidence: "high",
  },
  firstAssistantMessage: "Dzień dobry. Decyzja: prawdopodobnie kwalifikuje się.",
};

const messages = [
  {
    id: "m1",
    role: "user",
    parts: [{ type: "text", text: "Czy muszę odesłać pudełko?" }],
  },
];

function callChat(body: unknown) {
  return POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: "sk-or-test",
      OPENROUTER_CHAT_MODEL: "openai/gpt-5.4-mini",
      OPENROUTER_VISION_MODEL: "openai/gpt-5.4",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    resetAIAdapterFactoryForTests();
  });

  it("streams a chat response using the original matching policy", async () => {
    const ai = createMockAIAdapter({
      imageAnalysis: activeSession.imageAnalysis,
      decision: activeSession.initialDecision,
      chatText: "Odpowiedź serwisowa o pudełku i zwrocie.",
    });
    setAIAdapterFactoryForTests(() => ai);

    const response = await callChat({ activeSession, messages });

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Odpowiedź serwisowa");
    expect(ai.calls.streamChat).toHaveLength(1);
    expect(ai.calls.streamChat[0]).toMatchObject({
      modelId: "openai/gpt-5.4-mini",
    });
    expect(ai.calls.streamChat[0].prompt).toContain("docs/policies/polityka-zwrotow.md");
    expect(ai.calls.streamChat[0].prompt).toContain("wróć do sprawy zwrotu lub reklamacji");
  });

  it("rejects image data URLs in chat requests before model calls", async () => {
    const ai = createMockAIAdapter({
      imageAnalysis: activeSession.imageAnalysis,
      decision: activeSession.initialDecision,
    });
    setAIAdapterFactoryForTests(() => ai);

    const response = await callChat({
      activeSession,
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [{ type: "text", text: "data:image/png;base64,abc" }],
        },
      ],
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe(
      "Czat przyjmuje tylko tekst. Nie przesyłaj zdjęć po rozpoczęciu rozmowy.",
    );
    expect(ai.calls.streamChat).toHaveLength(0);
  });

  it("rejects invalid session context before model calls", async () => {
    const ai = createMockAIAdapter({
      imageAnalysis: activeSession.imageAnalysis,
      decision: activeSession.initialDecision,
    });
    setAIAdapterFactoryForTests(() => ai);

    const response = await callChat({
      activeSession: {
        ...activeSession,
        initialDecision: { ...activeSession.initialDecision, decision: "MAYBE" },
      },
      messages,
    });

    expect(response.status).toBe(400);
    expect(ai.calls.streamChat).toHaveLength(0);
  });

  it("returns retryable chat error when provider streaming fails", async () => {
    setAIAdapterFactoryForTests(() => ({
      analyzeImage: vi.fn(),
      generateDecision: vi.fn(),
      streamChat: vi.fn(() => {
        throw new Error("provider down");
      }),
    }));

    const response = await callChat({ activeSession, messages });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.retryable).toBe(true);
    expect(body.message).toBe("Nie udało się wysłać odpowiedzi. Spróbuj ponownie za chwilę.");
  });
});
