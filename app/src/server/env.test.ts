import { getOpenRouterConfig } from "./env";

describe("OpenRouter env validation", () => {
  it("requires API key and separate chat and vision model ids", () => {
    expect(() => getOpenRouterConfig({})).toThrow(
      "Brakuje konfiguracji usługi AI",
    );
  });

  it("normalizes valid config and defaults the base URL", () => {
    expect(
      getOpenRouterConfig({
        OPENROUTER_API_KEY: "sk-or-test",
        OPENROUTER_CHAT_MODEL: "openai/gpt-5.4-mini",
        OPENROUTER_VISION_MODEL: "openai/gpt-5.4",
      }),
    ).toMatchObject({
      apiKey: "sk-or-test",
      baseUrl: "https://openrouter.ai/api/v1",
      chatModel: "openai/gpt-5.4-mini",
      visionModel: "openai/gpt-5.4",
    });
  });
});
