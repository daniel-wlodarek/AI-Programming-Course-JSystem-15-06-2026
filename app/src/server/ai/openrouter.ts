import "server-only";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output, streamText } from "ai";
import { type OpenRouterConfig } from "@/server/env";
import { type AIAdapter } from "./assessment-orchestrator";
import { imageAnalysisSchema } from "./image-analysis-schema";
import { decisionResultSchema } from "./decision-schema";

function attributionHeaders(config: OpenRouterConfig): Record<string, string> {
  return {
    ...(config.appUrl ? { "HTTP-Referer": config.appUrl } : {}),
    ...(config.appTitle ? { "X-Title": config.appTitle } : {}),
  };
}

export function createOpenRouterAdapter(config: OpenRouterConfig): AIAdapter {
  const provider = createOpenRouter({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    headers: attributionHeaders(config),
    compatibility: "strict",
  });

  return {
    async analyzeImage({ modelId, prompt, image }) {
      const result = await generateText({
        model: provider(modelId),
        output: Output.object({
          schema: imageAnalysisSchema,
          name: "ImageAnalysis",
        }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image",
                image: image.data,
                mediaType: image.mediaType,
              },
            ],
          },
        ],
      });

      return result.output;
    },

    async generateDecision({ modelId, prompt }) {
      const result = await generateText({
        model: provider(modelId),
        output: Output.object({
          schema: decisionResultSchema,
          name: "DecisionResult",
        }),
        prompt,
      });

      return result.output;
    },

    streamChat({ modelId, prompt }) {
      const result = streamText({
        model: provider(modelId),
        prompt,
      });

      return result.toUIMessageStreamResponse({
        headers: {
          "Cache-Control": "no-store",
        },
      });
    },
  };
}
