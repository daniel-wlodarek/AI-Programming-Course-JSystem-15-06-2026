import { MANDATORY_DISCLAIMER } from "@/shared/polish-copy";
import { runAssessmentPipeline, type AIAdapter } from "./assessment-orchestrator";

const assessmentInput = {
  requestType: "RETURN" as const,
  equipmentCategory: "Laptop" as const,
  equipmentName: "ThinkPad X1",
  purchaseDate: "2026-06-01",
  reason: "",
};

const processedImage = {
  data: new Uint8Array([1, 2, 3]),
  mediaType: "image/jpeg",
};

const imageAnalysis = {
  requestType: "RETURN" as const,
  summary: "Laptop jest czysty i bez uszkodzeń.",
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

function adapter(overrides: Partial<AIAdapter> = {}): AIAdapter {
  return {
    analyzeImage: vi.fn().mockResolvedValue(imageAnalysis),
    generateDecision: vi.fn().mockResolvedValue(decision),
    streamChat: vi.fn(),
    ...overrides,
  };
}

describe("assessment orchestrator", () => {
  it("runs vision before decision and uses separate model roles", async () => {
    const ai = adapter();

    const result = await runAssessmentPipeline({
      assessmentInput,
      processedImage,
      ai,
      config: {
        apiKey: "sk-or-test",
        baseUrl: "https://openrouter.ai/api/v1",
        chatModel: "openai/gpt-5.4-mini",
        visionModel: "openai/gpt-5.4",
      },
    });

    expect(result.imageAnalysis).toEqual(imageAnalysis);
    expect(result.decision).toEqual(decision);
    expect(ai.analyzeImage).toHaveBeenCalledWith(
      expect.objectContaining({ modelId: "openai/gpt-5.4" }),
    );
    expect(ai.generateDecision).toHaveBeenCalledWith(
      expect.objectContaining({ modelId: "openai/gpt-5.4-mini" }),
    );
  });

  it("does not generate a decision after vision failure", async () => {
    const ai = adapter({
      analyzeImage: vi.fn().mockRejectedValue(new Error("vision down")),
    });

    await expect(
      runAssessmentPipeline({
        assessmentInput,
        processedImage,
        ai,
        config: {
          apiKey: "sk-or-test",
          baseUrl: "https://openrouter.ai/api/v1",
          chatModel: "openai/gpt-5.4-mini",
          visionModel: "openai/gpt-5.4",
        },
      }),
    ).rejects.toThrow("Nie udało się przeanalizować zdjęcia");

    expect(ai.generateDecision).not.toHaveBeenCalled();
  });

  it("retries invalid decision output once", async () => {
    const ai = adapter({
      generateDecision: vi
        .fn()
        .mockResolvedValueOnce({ ...decision, decision: "MAYBE" })
        .mockResolvedValueOnce(decision),
    });

    const result = await runAssessmentPipeline({
      assessmentInput,
      processedImage,
      ai,
      config: {
        apiKey: "sk-or-test",
        baseUrl: "https://openrouter.ai/api/v1",
        chatModel: "openai/gpt-5.4-mini",
        visionModel: "openai/gpt-5.4",
      },
    });

    expect(result.decision).toEqual(decision);
    expect(ai.generateDecision).toHaveBeenCalledTimes(2);
    expect(ai.generateDecision).toHaveBeenLastCalledWith(
      expect.objectContaining({ retry: true }),
    );
  });
});
