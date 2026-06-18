import {
  type DecisionResult,
  type ImageAnalysis,
} from "@/shared/contracts";
import {
  type AIAdapter,
  type AnalyzeImageArgs,
  type GenerateDecisionArgs,
  type StreamChatArgs,
} from "./assessment-orchestrator";

export interface MockAIAdapterOptions {
  imageAnalysis: ImageAnalysis;
  decision: DecisionResult;
  chatText?: string;
}

export function createMockAIAdapter({
  imageAnalysis,
  decision,
  chatText = "To testowa odpowiedź asystenta w kontekście aktywnego zgłoszenia.",
}: MockAIAdapterOptions): AIAdapter & {
  calls: {
    analyzeImage: AnalyzeImageArgs[];
    generateDecision: GenerateDecisionArgs[];
    streamChat: StreamChatArgs[];
  };
} {
  const calls = {
    analyzeImage: [] as AnalyzeImageArgs[],
    generateDecision: [] as GenerateDecisionArgs[],
    streamChat: [] as StreamChatArgs[],
  };

  return {
    calls,
    async analyzeImage(args) {
      calls.analyzeImage.push(args);
      return imageAnalysis;
    },
    async generateDecision(args) {
      calls.generateDecision.push(args);
      return decision;
    },
    streamChat(args) {
      calls.streamChat.push(args);
      return new Response(chatText, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    },
  };
}
