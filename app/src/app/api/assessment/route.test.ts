// @vitest-environment node

import sharp from "sharp";
import { MANDATORY_DISCLAIMER } from "@/shared/polish-copy";
import {
  resetAIAdapterFactoryForTests,
  setAIAdapterFactoryForTests,
} from "@/server/ai/adapter-factory";
import { createMockAIAdapter } from "@/server/ai/mock-adapter";
import { POST } from "./route";

const originalEnv = { ...process.env };

const imageAnalysis = {
  requestType: "RETURN" as const,
  summary: "Laptop jest czysty i bez widocznych uszkodzeń.",
  visibleDamage: "Brak.",
  likelyCause: "Nie dotyczy.",
  resaleCondition: "Dobry stan do odsprzedaży.",
  qualityIssues: [],
  confidence: "high" as const,
};

const decision = {
  decision: "APPROVE" as const,
  summary: "Zwrot prawdopodobnie kwalifikuje się do przyjęcia.",
  justification: "Zgłoszenie mieści się w terminie 14 dni.",
  policyReferences: ["Polityka zwrotów 2.1"],
  missingInformation: [],
  conditions: [],
  nextSteps: ["Przygotuj komplet akcesoriów."],
  disclaimer: MANDATORY_DISCLAIMER,
  confidence: "high" as const,
};

async function jpegFile(name = "sprzet.jpg") {
  const buffer = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: "#ffffff",
    },
  })
    .jpeg()
    .toBuffer();

  return new File([buffer], name, { type: "image/jpeg" });
}

async function validFormData() {
  const formData = new FormData();
  formData.set("requestType", "RETURN");
  formData.set("equipmentCategory", "Laptop");
  formData.set("equipmentName", "ThinkPad X1");
  formData.set("purchaseDate", "2026-06-01");
  formData.set("reason", "");
  formData.set("image", await jpegFile());
  return formData;
}

async function callAssessment(formData: FormData) {
  return POST(
    new Request("http://localhost/api/assessment", {
      method: "POST",
      body: formData,
    }),
  );
}

describe("POST /api/assessment", () => {
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

  it("returns an active session for a valid assessment", async () => {
    const ai = createMockAIAdapter({ imageAnalysis, decision });
    setAIAdapterFactoryForTests(() => ai);

    const response = await callAssessment(await validFormData());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sessionId).toEqual(expect.any(String));
    expect(body.assessmentInput).toMatchObject({
      requestType: "RETURN",
      equipmentCategory: "Laptop",
      equipmentName: "ThinkPad X1",
    });
    expect(body.imageAnalysis.summary).toContain("Laptop");
    expect(body.initialDecision.decision).toBe("APPROVE");
    expect(body.firstAssistantMessage).toContain("Dzień dobry");
    expect(JSON.stringify(body)).not.toContain("data:image");
    expect(ai.calls.analyzeImage).toHaveLength(1);
    expect(ai.calls.generateDecision).toHaveLength(1);
  });

  it("returns Polish field errors for invalid input and does not call AI", async () => {
    const ai = createMockAIAdapter({ imageAnalysis, decision });
    setAIAdapterFactoryForTests(() => ai);
    const formData = await validFormData();
    formData.set("requestType", "COMPLAINT");
    formData.set("reason", "   ");

    const response = await callAssessment(formData);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.fieldErrors.reason).toBe("Opisz usterkę, aby zgłosić reklamację.");
    expect(ai.calls.analyzeImage).toHaveLength(0);
    expect(ai.calls.generateDecision).toHaveLength(0);
  });

  it("rejects unsupported images before AI calls", async () => {
    const ai = createMockAIAdapter({ imageAnalysis, decision });
    setAIAdapterFactoryForTests(() => ai);
    const formData = await validFormData();
    formData.set("image", new File(["not image"], "plik.txt", { type: "text/plain" }));

    const response = await callAssessment(formData);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.fieldErrors.image).toBe("Akceptujemy tylko pliki JPEG, PNG albo WebP.");
    expect(ai.calls.analyzeImage).toHaveLength(0);
  });

  it("returns retryable service error with no decision when AI fails", async () => {
    setAIAdapterFactoryForTests(() => ({
      analyzeImage: vi.fn().mockRejectedValue(new Error("provider down")),
      generateDecision: vi.fn(),
      streamChat: vi.fn(),
    }));

    const response = await callAssessment(await validFormData());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.retryable).toBe(true);
    expect(body.message).toBe("Nie udało się przygotować oceny. Spróbuj ponownie za chwilę.");
    expect(body.initialDecision).toBeUndefined();
  });
});
